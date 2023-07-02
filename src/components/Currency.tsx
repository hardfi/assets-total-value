import React, { useEffect, useState } from 'react';

import { Flex } from 'rebass';

import currencyApi from '../api/currencyApi';
import { CurrencyCard } from './common/CurrencyCard';

import { ProgressSpinner } from 'primereact/progressspinner';

const baseCurrency = 'PLN';
const toShow = ['USD', 'EUR', 'GBP'];

export const Currency = () => {
  const [exchangeRates, setExchangeRates] = useState<any>();

  useEffect(() => {
    currencyApi.getRates(baseCurrency).then((res) => {
      setExchangeRates(res.data.conversion_rates);
    });
  }, []);

  return (
    <Flex p={4} flexDirection="column" style={{ gap: '20px' }}>
      {exchangeRates ? (
        <>
          {toShow.map((ticker) => (
            <CurrencyCard key={ticker} ticker={ticker} value={exchangeRates[ticker]} />
          ))}
        </>
      ) : (
        <ProgressSpinner
          style={{
            marginTop: '48px',
          }}
        />
      )}
    </Flex>
  );
};
