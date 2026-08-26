import httpClient from './httpClient';

import { AxiosResponse } from 'axios';

export type ExchangeRates = {
  conversion_rates: Record<string, number>;
};

const currencyApi = {
  getRates(baseCurrency: string): Promise<AxiosResponse<ExchangeRates>> {
    return httpClient.get('latest/' + baseCurrency);
  },
};

export default currencyApi;
