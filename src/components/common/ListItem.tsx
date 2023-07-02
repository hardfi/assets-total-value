import { Flex } from 'rebass';

import styled from 'styled-components';

export const ListItem = styled(Flex)<{ inCart?: boolean }>`
  padding: 12px;
  border-radius: 6px;
  background-color: ${({ inCart }) => (inCart ? 'var(--color-lightmain)' : 'var(--color-main)')};
`;
