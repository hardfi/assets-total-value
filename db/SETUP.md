# Self-hosted Postgres for assets-total-value

Runs on the **same GCP VM that already hosts home-helper**. Marginal cost: **0 zł**
— no new machine, no new IP address, no GCP firewall changes, because everything
goes through the Caddy that is already listening on 443.

---

## What we are building, and why it is not just "Postgres"

Supabase is not a database. It is Postgres **plus PostgREST**, a small service that
turns tables into an HTTP API. That HTTP layer is the only reason this app works at
all: it is a static React bundle with no backend, and a browser cannot speak the
Postgres wire protocol. Putting a real database password into a JS bundle would hand
anyone with devtools full write access.

So we run both pieces ourselves:

```
  browser
     |  https://<your-domain>/rest/v1/shopping
     v
  Caddy            <- already running, already has the TLS certificate
     |  http://postgrest:3000/shopping
     v
  PostgREST        <- turns HTTP into SQL, checks the JWT
     |  postgres://db:5432
     v
  Postgres         <- not reachable from the internet at all
```

The nice consequence: **`supabase-js` keeps working unchanged.** It already sends
requests to `<url>/rest/v1/<table>` with an `Authorization: Bearer <token>` header,
which is exactly what PostgREST expects. You only change two environment variables.

---

## Step 1 — SSH into the VM

Use the **SSH** button in the GCP console (Compute Engine → VM instances), same as
in home-helper's DEPLOY.md.

## Step 2 — Add swap

e2-micro has 1 GB of RAM and is already running home-helper + Caddy. Postgres and
PostgREST add roughly 150 MB and 40 MB. That fits, but with little headroom — swap
means a traffic spike degrades instead of getting a container OOM-killed.

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

## Step 3 — Create the shared network

Docker containers can only reach each other by name if they are on the same network.
Caddy lives in the home-helper compose project; PostgREST will live in its own. One
shared network bridges them:

```bash
docker network create edge
```

## Step 4 — Put Caddy on that network

Edit `~/home-helper/docker-compose.yml`, in the `caddy` service:

```yaml
  caddy:
    image: caddy:2-alpine
    # ...everything else stays as it is...
    networks:
      - default
      - edge
```

and add at the bottom of the file, next to the existing `volumes:` block:

```yaml
networks:
  edge:
    external: true
```

> **Careful:** the moment you add an explicit `networks:` list to a service, it stops
> joining `default` automatically. `default` **must** stay in the list, or Caddy will
> no longer find `app:8080` and home-helper goes down.

## Step 5 — Add the route

Edit `~/home-helper/Caddyfile`:

```
{$DOMENA} {
	handle_path /rest/v1/* {
		reverse_proxy postgrest:3000
	}
	reverse_proxy app:8080
}
```

`handle_path` (as opposed to `handle`) **strips the matched prefix**, so
`/rest/v1/shopping` arrives at PostgREST as `/shopping`. That is precisely the
translation that makes `supabase-js` work against a plain PostgREST.

Everything not starting with `/rest/v1/` still falls through to home-helper.

## Step 6 — Get the files onto the VM

```bash
cd ~
git clone https://github.com/hardfi/assets-total-value.git
cd assets-total-value/db
```

## Step 7 — Generate secrets

```bash
cp .env.example .env
cat > .env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
PGRST_DB_PASSWORD=$(openssl rand -hex 24)
PGRST_JWT_SECRET=$(openssl rand -base64 36 | tr -d '\n')
EOF
cat .env
```

> **Why hex for the two database passwords:** they get embedded in a connection URI
> (`postgres://authenticator:PASSWORD@db:5432/atv`). Characters like `@ : / +` from
> base64 would corrupt that URI in ways that produce confusing auth errors. Hex is
> URI-safe. The JWT secret is never in a URI, so base64 is fine there — and it needs
> to be at least 32 characters for HS256.

## Step 8 — Mint the anon token

This is the value that replaces your Supabase anon key. It never expires.

```bash
set -a; . ./.env; set +a
python3 - <<'PY'
import base64, hashlib, hmac, json, os
secret = os.environ["PGRST_JWT_SECRET"]
enc = lambda o: base64.urlsafe_b64encode(json.dumps(o, separators=(",", ":")).encode()).rstrip(b"=")
data = enc({"alg": "HS256", "typ": "JWT"}) + b"." + enc({"role": "web_anon"})
sig = base64.urlsafe_b64encode(hmac.new(secret.encode(), data, hashlib.sha256).digest()).rstrip(b"=")
print((data + b"." + sig).decode())
PY
```

Copy the output. It is a normal JWT whose payload is just `{"role":"web_anon"}` —
PostgREST verifies the signature with `PGRST_JWT_SECRET` and then runs your query as
the `web_anon` database role.

## Step 9 — Start it

```bash
docker compose up -d
docker compose ps
docker compose logs postgrest | tail -20
```

Then restart Caddy so it picks up the new route and network:

```bash
cd ~/home-helper && docker compose up -d
```

## Step 10 — Verify

From the VM (replace `TOKEN` and `DOMENA`):

```bash
curl -s -H "Authorization: Bearer TOKEN" https://DOMENA/rest/v1/shopping
```

Expected: `[]`. Three things worth checking explicitly:

```bash
# no token -> 401, proves the JWT is actually being enforced
curl -si https://DOMENA/rest/v1/shopping | head -1

# home-helper still works, proves the Caddy edit did not break it
curl -si https://DOMENA/ | head -1

# write path works
curl -s -X POST https://DOMENA/rest/v1/shopping \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name":"mleko","list":0}'
```

## Step 11 — Point the app at it

In the app's `.env`:

```
REACT_APP_SUPABASE_URL=https://DOMENA
REACT_APP_SUPABASE_KEY=<the JWT from step 8>
```

Rebuild and redeploy the frontend. No other code changes — except realtime, see below.

---

## Changing the schema later

`init/` scripts run **only once**, when the data volume is empty. This trips
everyone up at least once. To apply changes to a running database:

```bash
cd ~/assets-total-value/db
docker compose exec -T db psql -U atv -d atv < init/01-schema.sql
```

`01-schema.sql` is written to be re-runnable (`create table if not exists`,
`create or replace function`, `drop trigger if exists`), so this is safe to repeat.
It will not, however, alter an existing table — for that, write an `ALTER`.

To wipe and start completely fresh:

```bash
docker compose down -v && docker compose up -d
```

## Backups

Nobody else is doing this for you now. Weekly dump, keep the last 8:

```bash
mkdir -p ~/backups
cat > ~/backup-atv.sh <<'EOF'
#!/bin/sh
cd ~/assets-total-value/db || exit 1
docker compose exec -T db pg_dump -U atv atv | gzip > ~/backups/atv-$(date +%F).sql.gz
ls -1t ~/backups/atv-*.sql.gz | tail -n +9 | xargs -r rm
EOF
chmod +x ~/backup-atv.sh
( crontab -l 2>/dev/null; echo "0 4 * * 0 ~/backup-atv.sh" ) | crontab -
```

Restore:

```bash
gunzip -c ~/backups/atv-2026-08-24.sql.gz | docker compose exec -T db psql -U atv -d atv
```

## How safe is this really

Honest answer: **the same as what you have on Supabase today, which is to say, not
very.** The token sits in a public JS bundle, so anyone who finds both the URL and
the token can read and write all three tables — including `liabilities`, which is
your actual monthly financial obligations.

What the setup does buy you:

- Postgres itself is on an internal Docker network with no published port. The
  database is not on the internet; only PostgREST is.
- `web_anon` is a deliberately weak role. It cannot create tables, cannot read
  `pg_authid`, cannot touch anything not explicitly granted in `01-schema.sql`.
  Both were verified against a real Postgres, not assumed.
- Rotating access is one command: change `PGRST_JWT_SECRET`, mint a new token,
  redeploy. Every old token dies instantly.

If you ever want this genuinely private, the fix is real auth — a login that mints
short-lived per-user JWTs. That is a bigger change and is not what this setup does.

## What still needs changing in the app

`src/components/ShoppingList.tsx` opens a **Supabase Realtime** subscription so that
when one of you ticks an item off in the shop, it updates on the other's phone live.
PostgREST has no realtime — it is HTTP request/response only. Left as-is, the app
will keep trying to open a websocket that does not exist and retry in a loop.

Options: replace it with polling every few seconds while the tab is visible
(simple, ~15 lines, plenty for a shopping list), or drop the live sync. Running
Supabase's own realtime service is possible but it is an Elixir app that wants
logical replication, and on a 1 GB VM that is asking for trouble.
