export const getRounded = (amount: number, decimals = 2): number => {
  const rounder = Math.pow(10, decimals);
  return Math.round(amount * rounder) / rounder;
};

export const getIntlNumber = (number: number, countryCode = 'pl-PL') =>
  new Intl.NumberFormat(countryCode).format(number);
