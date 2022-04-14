import React, { useEffect, useMemo, useState } from 'react';

import { Box, Flex } from 'rebass';

import currencyApi from '../api/currencyApi';
import { getIntlNumber, getRounded } from '../utils/functions';

import { Dropdown } from 'primereact/dropdown';
import styled from 'styled-components';

const CURRENCY_CACHE_DATA_KEY = 'API_DATA';

type MyFXAsset = {
  curr: string;
  amount: number;
};

type TableRow = {
  curr: string;
  amount: number;
  rate: number;
  total: number;
};

const BASE_CURRENCIES = [
  { label: 'EUR', value: 'EUR' },
  { label: 'PLN', value: 'PLN' },
  { label: 'GBP', value: 'GBP' },
  { label: 'USD', value: 'USD' },
];

const CurrencyAssets = () => {
  const [baseCurrency, setBaseCurrency] = useState<string>('PLN');
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number } | undefined>(
    undefined,
  );
  const [myFXCash, setMyFXCash] = useState<MyFXAsset[]>([
    { curr: 'EUR', amount: 100 },
    { curr: 'USD', amount: 5987 },
    { curr: 'GBP', amount: 600 },
  ]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    // currencyApi.getRates(baseCurrency).then((res) => {
    //   localStorage.setItem(CURRENCY_CACHE_DATA_KEY, JSON.stringify(res.data.conversion_rates));
    //   setExchangeRates(res.data.conversion_rates);
    // });

    const data = JSON.parse(localStorage.getItem(CURRENCY_CACHE_DATA_KEY) || '');
    setExchangeRates(data);
  }, [baseCurrency]);

  useMemo(() => {
    if (exchangeRates) {
      let _total = 0;
      const _rows = myFXCash.map((position) => {
        const rate = 1 / exchangeRates[position.curr];
        const total = getRounded(position.amount * rate);
        _total += total;

        return {
          amount: position.amount,
          curr: position.curr,
          rate: getRounded(rate, 4),
          total,
        };
      });
      setRows(_rows);
      setTotal(getRounded(_total));
    }
  }, [exchangeRates]);

  return (
    <Wrapper flexDirection="column" width="100%" m={4}>
      <Flex alignItems="center" justifyContent="space-between" flexDirection="column" mb={4}>
        <h2>FX assets</h2>
        <Flex alignItems="center">
          <Box style={{ width: 80, textAlign: 'right' }} mr={2}>
            Base currency
          </Box>
          <Dropdown
            value={baseCurrency}
            options={BASE_CURRENCIES}
            onChange={(e) => setBaseCurrency(e.value)}
          />
        </Flex>
      </Flex>
      <CurrencyRow justifyContent="space-between">
        <Box flex={1}></Box>
        <Box flex={1}></Box>
        <Box flex={3}></Box>
        <Box flex={3}>Rate</Box>
        <Box flex={4}>Total</Box>
      </CurrencyRow>
      {rows.map((c, i) => (
        <CurrencyRow key={`${c}_${i}`} justifyContent="space-between" background={true} mb={2}>
          <Box flex={1}>{i + 1}.</Box>
          <Box flex={1}>{c.curr}</Box>
          <Flex flex={3}>{getIntlNumber(c.amount)}</Flex>
          <Flex flex={3}>{getIntlNumber(c.rate)}</Flex>
          <Flex flex={4}>
            {getIntlNumber(c.total)} {baseCurrency}
          </Flex>
        </CurrencyRow>
      ))}
      <Total justifyContent="flex-end">
        <Box mr={4}>Total:</Box> {getIntlNumber(total)} {baseCurrency}
      </Total>
    </Wrapper>
  );
};

const Wrapper = styled(Flex)`
  --row-padding: 16px;
  --font-bolder: 600;
`;

const CurrencyRow = styled(Flex)<{ background?: boolean }>`
  width: 100%;
  background-color: ${({ background }) => (background ? '#fff' : 'none')};
  padding: var(--row-padding);
  border-radius: 6px;

  div:nth-child(3),
  div:nth-child(4),
  div:nth-child(5) {
    justify-content: flex-end;
    text-align: end;
  }

  div:nth-child(5) {
    font-weight: var(--font-bolder);
  }
`;

const Total = styled(Flex)`
  font-weight: var(--font-bolder);
  padding: var(--row-padding);
`;

export default CurrencyAssets;
