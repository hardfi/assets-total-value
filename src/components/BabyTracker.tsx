import React, { useEffect, useMemo, useState } from 'react';

import { Box, Flex } from 'rebass';

import supabaseApi from '../api/supabaseApi';
import { BabyEvent, BabyEventType } from '../api/typings';
import {
  formatDayLabel,
  formatDuration,
  formatHour,
  fromDateTimeLocal,
  shiftDateTimeLocal,
  toDateTimeLocal,
} from '../utils/functions';
import { Button } from './common/Button';
import { ItemName } from './common/ItemName';
import { ListItem } from './common/ListItem';
import { RemoveButton } from './common/RemoveButton';

import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import styled, { keyframes } from 'styled-components';

type BabyAction = {
  type: BabyEventType;
  emoji: string;
  label: string;
  hasDuration?: boolean;
};

const ACTIONS: BabyAction[] = [
  { type: BabyEventType.SLEEP, emoji: '😴', label: 'Sen', hasDuration: true },
  // Logged with a single tap once the feed is over — only the "how long since
  // the last one" counter matters, not how long it took.
  { type: BabyEventType.FEEDING, emoji: '🍼', label: 'Karmienie' },
  { type: BabyEventType.POOP, emoji: '💩', label: 'Kupa' },
  { type: BabyEventType.PEE, emoji: '💧', label: 'Siku' },
  { type: BabyEventType.BATH, emoji: '🛁', label: 'Kąpiel' },
  { type: BabyEventType.VITAMIN, emoji: '💊', label: 'Witamina D' },
];

const QUICK_AMOUNTS = [30, 60, 90, 120, 150, 180];

// Logging usually happens a little after the fact, so offer a fast way back.
const QUICK_SHIFTS = [5, 15, 30, 60];

const ACTIONS_BY_TYPE = ACTIONS.reduce((map, action) => {
  map[action.type] = action;
  return map;
}, {} as Record<BabyEventType, BabyAction>);

type EventGroup = {
  day: string;
  label: string;
  events: BabyEvent[];
};

type Props = {
  theme: string;
};

const getStart = (event: BabyEvent) => new Date(event.started_at).getTime();
const getEnd = (event: BabyEvent, fallback: number) =>
  event.ended_at ? new Date(event.ended_at).getTime() : fallback;
const isOngoing = (event: BabyEvent) =>
  !!ACTIONS_BY_TYPE[event.type]?.hasDuration && !event.ended_at;

export const BabyTracker = ({ theme }: Props) => {
  const [events, setEvents] = useState<BabyEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingType, setPendingType] = useState<BabyEventType | null>(null);
  const [editEvent, setEditEvent] = useState<BabyEvent | null>(null);
  const [startValue, setStartValue] = useState<string>('');
  const [endValue, setEndValue] = useState<string>('');
  const [amountValue, setAmountValue] = useState<string>('');
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    getEvents();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getEvents = () =>
    supabaseApi
      .getBabyEvents()
      .then((res) => {
        if (res.data) {
          setEvents(res.data);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));

  // events arrive sorted by started_at descending, so the first hit is always the latest one
  const ongoingByType = useMemo(() => {
    const map: Partial<Record<BabyEventType, BabyEvent>> = {};
    events.forEach((event) => {
      if (isOngoing(event) && !map[event.type]) {
        map[event.type] = event;
      }
    });
    return map;
  }, [events]);

  const lastByType = useMemo(() => {
    const map: Partial<Record<BabyEventType, BabyEvent>> = {};
    events.forEach((event) => {
      if (!map[event.type]) {
        map[event.type] = event;
      }
    });
    return map;
  }, [events]);

  const groups = useMemo(() => {
    const result: EventGroup[] = [];
    events.forEach((event) => {
      const date = new Date(event.started_at);
      const day = date.toDateString();
      const currentGroup = result[result.length - 1];
      if (currentGroup && currentGroup.day === day) {
        currentGroup.events.push(event);
      } else {
        result.push({ day, label: formatDayLabel(date), events: [event] });
      }
    });
    return result;
  }, [events]);

  const handleAction = (action: BabyAction) => {
    if (pendingType) {
      return;
    }
    setPendingType(action.type);

    // Anything that happens closes whatever timer is running: the baby cannot
    // still be asleep once we log a poop. The new event starts at the same
    // instant the old one ends, so the history has no gap.
    const timestamp = new Date().toISOString();
    const running = events.filter(isOngoing);
    const stoppedItself = running.some((event) => event.type === action.type);

    const requests = running.map((event) =>
      supabaseApi.finishBabyEvent(event.uuid!, timestamp).then((res) => res),
    );
    const created = stoppedItself
      ? null
      : supabaseApi
          .createBabyEvent({ type: action.type, started_at: timestamp })
          .then((res) => res);
    if (created) {
      requests.push(created);
    }

    Promise.all(requests)
      .then(() => getEvents())
      .then(() => created)
      .then((res) => {
        // A feed is logged once it is already over, so ask for the amount now.
        const inserted = res && res.data ? res.data[0] : undefined;
        if (action.type === BabyEventType.FEEDING && inserted) {
          openEditDialog(inserted);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setPendingType(null));
  };

  const openEditDialog = (event: BabyEvent) => {
    setEditEvent(event);
    setStartValue(toDateTimeLocal(event.started_at));
    setEndValue(event.ended_at ? toDateTimeLocal(event.ended_at) : '');
    setAmountValue(event.amount_ml ? String(event.amount_ml) : '');
  };

  const closeEditDialog = () => {
    setEditEvent(null);
    setStartValue('');
    setEndValue('');
    setAmountValue('');
  };

  // Both are UTC ISO strings of equal shape, so a string compare is a time compare.
  const editStartIso = fromDateTimeLocal(startValue);
  const editEndIso = endValue ? fromDateTimeLocal(endValue) : null;
  const editInvalid = !editStartIso || !!(editEndIso && editEndIso < editStartIso);

  const saveEdit = () => {
    if (!editEvent || editInvalid) {
      return;
    }
    const startedAt = fromDateTimeLocal(startValue);
    if (!startedAt) {
      return;
    }

    const changes: Partial<BabyEvent> = { started_at: startedAt };
    // Only events that already finished carry an end — never resurrect one.
    if (editEvent.ended_at) {
      changes.ended_at = fromDateTimeLocal(endValue) || editEvent.ended_at;
    }
    if (editEvent.type === BabyEventType.FEEDING) {
      changes.amount_ml = amountValue ? +amountValue : null;
    }

    supabaseApi
      .updateBabyEvent(editEvent.uuid!, changes)
      .then(() => getEvents())
      .catch((err) => console.log(err));
    closeEditDialog();
  };

  const removeEvent = (uuid: string) => {
    supabaseApi
      .removeBabyEvent(uuid)
      .then(() => getEvents())
      .catch((err) => console.log(err));
  };

  const getTileSubtitle = (action: BabyAction) => {
    const ongoing = ongoingByType[action.type];
    if (ongoing) {
      return formatDuration(now - getStart(ongoing));
    }
    const last = lastByType[action.type];
    if (!last) {
      return '—';
    }
    return `${formatDuration(now - getEnd(last, getStart(last)))} temu`;
  };

  const getDaySummary = (group: EventGroup) => {
    const sleepMs = group.events
      .filter((event) => event.type === BabyEventType.SLEEP)
      .reduce((total, event) => total + (getEnd(event, now) - getStart(event)), 0);
    const feedings = group.events.filter((event) => event.type === BabyEventType.FEEDING).length;
    const poops = group.events.filter((event) => event.type === BabyEventType.POOP).length;
    const milkMl = group.events.reduce((total, event) => total + (event.amount_ml || 0), 0);

    return [
      sleepMs ? `😴 ${formatDuration(sleepMs)}` : null,
      feedings ? `🍼 ${feedings}x${milkMl ? ` · ${milkMl} ml` : ''}` : null,
      poops ? `💩 ${poops}x` : null,
    ]
      .filter(Boolean)
      .join('   ·   ');
  };

  if (loading) {
    return <ProgressSpinner style={{ marginTop: '48px' }} />;
  }

  return (
    <Flex flexDirection="column" mt={2} pb="80px">
      <Tiles>
        {ACTIONS.map((action) => {
          const ongoing = !!ongoingByType[action.type];
          return (
            <Tile
              key={action.type}
              $active={ongoing}
              $pending={pendingType === action.type}
              onClick={() => handleAction(action)}
            >
              <Emoji>{action.emoji}</Emoji>
              <TileLabel>{action.label}</TileLabel>
              <TileValue>{getTileSubtitle(action)}</TileValue>
              {action.hasDuration ? <TileHint>{ongoing ? 'stop' : 'start'}</TileHint> : null}
            </Tile>
          );
        })}
      </Tiles>

      {groups.length ? (
        groups.map((group) => (
          <Box key={group.day} mt={4}>
            <DayHeader alignItems="baseline" justifyContent="space-between" mb={3}>
              <Box>{group.label}</Box>
              <DaySummary>{getDaySummary(group)}</DaySummary>
            </DayHeader>
            {group.events.map((event) => {
              const action = ACTIONS_BY_TYPE[event.type];
              const ongoing = isOngoing(event);
              const isFeeding = event.type === BabyEventType.FEEDING;
              return (
                <EventRow
                  key={event.uuid}
                  $ongoing={ongoing}
                  mb={1}
                  alignItems="center"
                  justifyContent="space-between"
                  padding="8px"
                  onClick={() => openEditDialog(event)}
                >
                  <Emoji>{action?.emoji || '❓'}</Emoji>
                  <Flex flexDirection="column" flex={1} ml={2}>
                    <ItemName theme={theme}>{action?.label || event.type}</ItemName>
                    <Hours>
                      {formatHour(new Date(event.started_at))}
                      {event.ended_at ? ` – ${formatHour(new Date(event.ended_at))}` : ''}
                    </Hours>
                  </Flex>
                  {action?.hasDuration ? (
                    <ItemName theme={theme} mr={2} style={{ whiteSpace: 'nowrap' }}>
                      {ongoing
                        ? `⏱ ${formatDuration(now - getStart(event))}`
                        : formatDuration(getEnd(event, now) - getStart(event))}
                    </ItemName>
                  ) : null}
                  {isFeeding && event.amount_ml ? (
                    <ItemName theme={theme} mr={2} style={{ whiteSpace: 'nowrap' }}>
                      {event.amount_ml} ml
                    </ItemName>
                  ) : null}
                  {isFeeding && !event.amount_ml ? <AddAmount>+ ml</AddAmount> : null}
                  <RemoveButton
                    style={{ flexShrink: 0 }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      removeEvent(event.uuid!);
                    }}
                  >
                    x
                  </RemoveButton>
                </EventRow>
              );
            })}
          </Box>
        ))
      ) : (
        <Empty mt={5}>Jeszcze nic tu nie ma — kliknij ikonę powyżej 👆</Empty>
      )}

      {editEvent ? (
        <Overlay onClick={closeEditDialog}>
          <Dialog onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <DialogTitle>
              {ACTIONS_BY_TYPE[editEvent.type]?.emoji} {ACTIONS_BY_TYPE[editEvent.type]?.label}
            </DialogTitle>

            <FieldLabel>{editEvent.ended_at ? 'Początek' : 'Kiedy?'}</FieldLabel>
            <InputText
              value={startValue}
              type="datetime-local"
              onChange={(e) => setStartValue(e.target.value)}
              style={{ width: '100%' }}
            />
            <Shifts>
              {QUICK_SHIFTS.map((minutes) => (
                <ShiftButton
                  key={minutes}
                  onClick={() => setStartValue(shiftDateTimeLocal(startValue, -minutes))}
                >
                  −{minutes} min
                </ShiftButton>
              ))}
            </Shifts>

            {editEvent.ended_at ? (
              <>
                <FieldLabel>Koniec</FieldLabel>
                <InputText
                  value={endValue}
                  type="datetime-local"
                  onChange={(e) => setEndValue(e.target.value)}
                  style={{ width: '100%' }}
                />
              </>
            ) : null}

            {editEvent.type === BabyEventType.FEEDING ? (
              <>
                <FieldLabel>Ile ml?</FieldLabel>
                <Amounts>
                  {QUICK_AMOUNTS.map((amount) => (
                    <AmountButton
                      key={amount}
                      $selected={+amountValue === amount}
                      onClick={() => setAmountValue(String(amount))}
                    >
                      {amount}
                    </AmountButton>
                  ))}
                </Amounts>
                <InputText
                  value={amountValue}
                  type="number"
                  onChange={(e) => setAmountValue(e.target.value)}
                  placeholder="ml"
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </>
            ) : null}

            {editInvalid ? <Warning>Koniec nie może być przed początkiem</Warning> : null}

            <Flex justifyContent="space-between" mt={3}>
              <Button style={{ backgroundColor: 'grey' }} onClick={closeEditDialog}>
                Anuluj
              </Button>
              <Button
                onClick={saveEdit}
                disabled={editInvalid}
                style={{ opacity: editInvalid ? 0.5 : 1 }}
              >
                Zapisz
              </Button>
            </Flex>
          </Dialog>
        </Overlay>
      ) : null}
    </Flex>
  );
};

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 var(--color-deepmain); }
  70% { box-shadow: 0 0 0 8px rgba(0, 0, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
`;

const Tiles = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 8px;
  width: 100%;
`;

const Tile = styled.div<{ $active?: boolean; $pending?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 4px;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  background-color: ${({ $active }) => ($active ? 'var(--color-deepmain)' : 'var(--color-main)')};
  color: ${({ $active }) => ($active ? 'white' : 'var(--color-text)')};
  opacity: ${({ $pending }) => ($pending ? 0.5 : 1)};
  animation: ${({ $active }) => ($active ? pulse : 'none')} 2s infinite;
`;

const Emoji = styled.div`
  font-size: 26px;
  line-height: 1.2;
`;

const TileLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
`;

const TileValue = styled.div`
  font-size: 12px;
  font-weight: 700;
  margin-top: 2px;
  white-space: nowrap;
`;

const TileHint = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
`;

const DayHeader = styled(Flex)`
  color: var(--primary-color);
  font-weight: 700;
  border-bottom: 2px solid var(--color-main);
  padding-bottom: 8px;
  /* the gap below is set with rebass's mb prop, not here: Box's own
     emotion styles hard-code margin: 0 and would override it */
`;

const DaySummary = styled.div`
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
`;

const EventRow = styled(ListItem)<{ $ongoing?: boolean }>`
  border-left: 4px solid ${({ $ongoing }) => ($ongoing ? 'var(--color-deepmain)' : 'transparent')};
  cursor: pointer;
`;

const AddAmount = styled.div`
  margin-right: 8px;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px dashed var(--color-deepmain);
  color: var(--color-deepmain);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: rgba(0, 0, 0, 0.45);
`;

const Dialog = styled.div`
  width: 100%;
  max-width: 320px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
`;

const DialogTitle = styled.div`
  margin-bottom: 12px;
  color: var(--gray-700);
  font-size: 18px;
  font-weight: 700;
`;

const FieldLabel = styled.div`
  margin: 12px 0 6px;
  color: var(--gray-700);
  font-size: 13px;
  font-weight: 600;
`;

const Shifts = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 6px;
  margin-top: 8px;
`;

const ShiftButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  background-color: var(--color-main);
  color: var(--color-text);
`;

const Warning = styled.div`
  margin-top: 12px;
  color: crimson;
  font-size: 12px;
  font-weight: 600;
`;

const Amounts = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 8px;
`;

const AmountButton = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  font-weight: 700;
  background-color: ${({ $selected }) =>
    $selected ? 'var(--color-deepmain)' : 'var(--color-main)'};
  color: ${({ $selected }) => ($selected ? 'white' : 'var(--color-text)')};
`;

const Hours = styled.div`
  color: var(--color-text);
  font-size: 12px;
  opacity: 0.8;
  text-align: left;
`;

const Empty = styled(Box)`
  color: var(--primary-color);
`;

export default BabyTracker;
