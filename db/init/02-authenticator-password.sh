#!/bin/sh
# Sets the `authenticator` password from the environment so the secret
# never has to live in a .sql file that gets committed to git.
# Runs once, right after 01-schema.sql, on first container start.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
  alter role authenticator with login password '${PGRST_DB_PASSWORD}';
SQL
