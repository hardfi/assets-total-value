import { Flex } from 'rebass';

import styled from 'styled-components';

export const Modal = styled(Flex)`
  margin: 0;
  z-index: 99;
  width: 100vw;
  min-height: calc(100vh - 120px);
  background-color: white;
  padding: 40px;
  max-width: 100%;
`;
