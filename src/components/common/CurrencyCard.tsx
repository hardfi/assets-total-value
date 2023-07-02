import React from 'react';

import { Flex } from 'rebass';

import styled from 'styled-components';

type Props = {
  ticker: string;
  value: number;
};

export const CurrencyCard = ({ ticker, value }: Props) => {
  return (
    <Card p={3} flexDirection="column" alignItems="center">
      <Ticker>{ticker}</Ticker>
      <Val>{(1 / value).toFixed(4)} zł</Val>
    </Card>
  );
};

const Card = styled(Flex)`
  border-radius: 8px;
  background-color: var(--color-main);
  color: var(--color-text);
`;

const Ticker = styled.div`
  font-weight: 400;
  font-size: 32px;
  margin-bottom: 16px;
`;

const Val = styled.div`
  font-weight: 700;
  font-size: 22px;
  margin-bottom: 16px;
`;
