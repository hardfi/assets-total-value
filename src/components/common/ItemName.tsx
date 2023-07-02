import { Flex } from 'rebass';

import styled from 'styled-components';

export const ItemName = styled(Flex)<{ inCart?: boolean; theme: string }>`
  color: ${({ theme }) => (theme === 'pink' ? 'var(--gray-700)' : 'white')};
  font-weight: 500;
  word-break: break-word;
  text-align: left;
  text-decoration: ${({ inCart }) => (inCart ? 'line-through' : 'none')};
`;
