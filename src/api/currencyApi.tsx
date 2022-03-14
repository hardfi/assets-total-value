import httpClient from './httpClient';

const currencyApi = {
  getRates(baseCurrency: string): Promise<any> {
    return httpClient.get('latest/' + baseCurrency);
  },
};

export default currencyApi;
