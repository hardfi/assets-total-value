export const getRounded = (amount: number, decimals = 2): number => {
  const rounder = Math.pow(10, decimals);
  return Math.round(amount * rounder) / rounder;
};

export const getIntlNumber = (number: number, countryCode = 'pl-PL') =>
  new Intl.NumberFormat(countryCode).format(number);

export const saveToLocalStorage = (item: string, key: string) => {
  localStorage.setItem(key, item);
}

export const getFromLocalStorage = (key: string) => {
  const item = localStorage.getItem(key);
  if (item && item !== 'undefined') {
    return JSON.parse(item);
  }
  return undefined;
}

export enum LocalStorageKeys {
  SHOPPING_LIST= 'shopping-list'
}
