import React, { useEffect, useState, ReactNode } from 'react';

import { Flex } from 'rebass';

import currencyApi from '../api/currencyApi';

import { ProgressSpinner } from 'primereact/progressspinner';
import styled from 'styled-components';

const baseCurrency = 'PLN';
const toShow = ['USD', 'EUR', 'GBP'];

type CurrencyBannerProps = {
  children?: ReactNode;
};

export const CurrencyBanner = ({ children }: CurrencyBannerProps) => {
  const [exchangeRates, setExchangeRates] = useState<any>();

  useEffect(() => {
    currencyApi.getRates(baseCurrency).then((res) => {
      setExchangeRates(res.data.conversion_rates);
    });
  }, []);

  if (!exchangeRates) {
    return (
      <BannerWrapper>
        <Flex justifyContent="center" width="100%">
          <ProgressSpinner style={{ width: '20px', height: '20px' }} />
        </Flex>
        {children}
      </BannerWrapper>
    );
  }

  return (
    <BannerWrapper>
      <Flex alignItems="center" justifyContent="space-between" width="100%" px={4} >
        {toShow.map((ticker) => (
          <BannerCard key={ticker}>
            <span className="ticker">{ticker}</span>
            <span className="rate">{(1 / exchangeRates[ticker]).toFixed(2)}zł</span>
          </BannerCard>
        ))}
      {children}
      </Flex>
    </BannerWrapper>
  );
};

const BannerWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  background: linear-gradient(90deg, var(--color-main) 0%, var(--color-deepmain) 100%);
  color: white;
  padding: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
`;

const BannerCard = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
    font-size: 16px;

  .ticker {
    font-weight: 400;
    opacity: 0.9;
  }

  .rate {
    font-weight: 700;
  }
`; 