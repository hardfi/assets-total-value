import React from 'react';
import { Link } from 'react-router-dom';

import { Flex } from 'rebass';

import styled from 'styled-components';

export const Homepage = () => {
  return (
    <Flex>
      <Tile to="/shopping">🛒</Tile>
      {/*<Tile></Tile>*/}
      {/*<Tile></Tile>*/}
      {/*<Tile></Tile>*/}
      {/*<Tile></Tile>*/}
      {/*<Tile></Tile>*/}
      {/*<Tile></Tile>*/}
    </Flex>
  );
};

const Tile = styled(Link)`
  border-radius: 6px;
  background-color: lightgray;
`;
