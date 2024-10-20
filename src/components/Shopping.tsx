import React, { useEffect, useState } from 'react';

import { Flex } from 'rebass';

import { Currency } from './Currency';
import { LiabilitiesList } from './LiabilitiesList';
import LinksList from './LinksList';
import ShoppingList from './ShoppingList';

import { TabPanel, TabView } from 'primereact/tabview';
import styled from 'styled-components';

const Shopping = () => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [theme, setTheme] = useState<string>('pink');

  useEffect(() => {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
      setTheme(currentTheme);
    }
  }, []);

  const changeTheme = () => {
    const currentTheme = localStorage.getItem('theme');
    let newTheme = 'pink';
    if (currentTheme && currentTheme === 'pink') {
      newTheme = 'dark';
    }
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  return (
    <Wrapper className="card" width="100vw" theme={theme}>
      <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
        <TabPanel header="🛒">
          <ShoppingList listNumber={0} theme={theme} />
        </TabPanel>
        <TabPanel header="🏡">
          <ShoppingList listNumber={1} theme={theme} />
        </TabPanel>
        <TabPanel header="🔗">
          <LinksList listNumber={2} theme={theme} />
        </TabPanel>
        <TabPanel header="💰">
          <LiabilitiesList theme={theme} />
        </TabPanel>
        <TabPanel header="💰">
          <LiabilitiesList theme={theme} />
        </TabPanel>
        <TabPanel header="💸">
          <Currency />
        </TabPanel>
      </TabView>
      <ThemeButton onClick={changeTheme}>C</ThemeButton>
    </Wrapper>
  );
};

const Wrapper = styled(Flex)<{ theme?: string }>`
  --color-main: ${({ theme }) => (theme === 'pink' ? 'pink' : '#5163c7')};
  --color-lightmain: ${({ theme }) => (theme === 'pink' ? 'rgba(255, 192, 203, 0.3)' : '#adb9ff')};
  --color-deepmain: ${({ theme }) => (theme === 'pink' ? 'deeppink' : '#304096')};
  --color-text: ${({ theme }) => (theme === 'pink' ? 'var(--gray-700)' : 'white')};

  .p-tabview {
    width: 100%;
  }

  .p-tabview .p-tabview-nav li .p-tabview-nav-link:not(.p-disabled):focus {
    box-shadow: none;
  }
`;

const ThemeButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 14px;
  right: 16px;
  border-radius: 4px;
  border: 1px solid gray;
  width: 28px;
  height: 28px;
  font-weight: bold;
  color: var(--color-text);
  background-color: var(--color-main);
`;

export default Shopping;
