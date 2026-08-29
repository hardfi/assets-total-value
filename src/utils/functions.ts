export const getRounded = (amount: number, decimals = 2): number => {
  const rounder = Math.pow(10, decimals);
  return Math.round(amount * rounder) / rounder;
};

export const getIntlNumber = (number: number, countryCode = 'pl-PL') =>
  new Intl.NumberFormat(countryCode).format(number);

export const saveToLocalStorage = (item: string, key: string) => {
  localStorage.setItem(key, item);
};

export const getFromLocalStorage = (key: string) => {
  const item = localStorage.getItem(key);
  if (item && item !== 'undefined') {
    return JSON.parse(item);
  }
  return undefined;
};

export enum LocalStorageKeys {
  SHOPPING_LIST = 'shopping-list',
}

export const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours) {
    return `${hours}h ${minutes}min`;
  }
  if (minutes) {
    return `${minutes}min ${seconds}s`;
  }
  return `${seconds}s`;
};

export const formatHour = (date: Date, countryCode = 'pl-PL'): string =>
  new Intl.DateTimeFormat(countryCode, { hour: '2-digit', minute: '2-digit' }).format(date);

export const formatDayLabel = (date: Date, countryCode = 'pl-PL'): string => {
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const daysAgo = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

  if (daysAgo === 0) {
    return 'Dzisiaj';
  }
  if (daysAgo === 1) {
    return 'Wczoraj';
  }
  return new Intl.DateTimeFormat(countryCode, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
};

// <input type="datetime-local"> speaks local wall-clock time with no zone,
// which is exactly how a parent thinks about "when did this happen".
export const toDateTimeLocal = (isoDate: string): string => {
  const date = new Date(isoDate);
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};

export const fromDateTimeLocal = (value: string): string | null => {
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
};

export const shiftDateTimeLocal = (value: string, minutes: number): string => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return value;
  }
  return toDateTimeLocal(new Date(date.getTime() + minutes * 60000).toISOString());
};
