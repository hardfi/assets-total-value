import React, { useEffect, useState } from 'react';

import { Box, Flex } from 'rebass';

import supabaseApi from '../api/supabaseApi';
import { LiabilityItem } from '../api/typings';
import { Button } from './common/Button';
import { ItemName } from './common/ItemName';
import { ListItem } from './common/ListItem';
import { Modal } from './common/Modal';
import { RemoveButton } from './common/RemoveButton';
import { RoundButton } from './common/RoundButton';

import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import styled from 'styled-components';

type Props = {
  theme: string;
};

const LS_KEY = 'LS_CHECKED_ITEMS';

export const LiabilitiesListWithCheckboxes = ({ theme }: Props) => {
  const [list, setList] = useState<LiabilityItem[]>([]);
  const [unselectedList, setUnselectedList] = useState<LiabilityItem[]>([]);
  const [sumPaid, setSumPaid] = useState<string>('');
  const [sumUnPaid, setSumUnPaid] = useState<string>('');

  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    getLiabilitiesList();
    const savedCheckboxes = localStorage.getItem(LS_KEY);
    if (savedCheckboxes) {
      setCheckedItems(JSON.parse(savedCheckboxes));
    }
  }, []);

  useEffect(() => {
    updateSum();
  }, [list, checkedItems]);

  const getLiabilitiesList = () => {
    supabaseApi.getLiabilitiesList().then((res) => {
      if (res.data) {
        setList(res.data.sort((a, b) => b.amount - a.amount));
      }
    });
  };

  const toggleSelected = (item: LiabilityItem) => {
    const itemIsUnselected = unselectedList.find((unselected) => unselected.uuid === item.uuid);
    if (itemIsUnselected) {
      const filtered = unselectedList.filter((item) => item.uuid !== itemIsUnselected.uuid);
      setUnselectedList(filtered);
    } else {
      const newList = [...unselectedList];
      newList.push(item);
      setUnselectedList(newList);
    }
  };

  const updateSum = () => {
    const _sum = list.reduce(
      ({ unpaid, paid }, item) => {
        if (checkedItems.includes(item.name)) {
          paid += item.amount;
        } else {
          unpaid += item.amount;
        }
        return { unpaid, paid };
      },
      { unpaid: 0, paid: 0 },
    );
    setSumPaid(String(parseInt(String(_sum.paid))));
    setSumUnPaid(String(parseInt(String(_sum.unpaid))));
  };

  const onToggleItem = (item: LiabilityItem) => {
    let newCheckedItems = [...checkedItems];
    if (checkedItems.includes(item.name)) {
      newCheckedItems = newCheckedItems.filter((i) => i !== item.name);
    } else {
      newCheckedItems = [...newCheckedItems, item.name];
    }
    setCheckedItems(newCheckedItems);
    localStorage.setItem(LS_KEY, JSON.stringify(newCheckedItems));
  };

  if (!list.length) {
    return (
      <ProgressSpinner
        style={{
          marginTop: '48px',
        }}
      />
    );
  }

  return (
    <>
      <Flex flexDirection="column" mt={3} flex={1}>
        {list.map((listItem) => {
          const isPaid = checkedItems.find((item) => item === listItem.name);
          return (
            <ListItem
              key={listItem.uuid + '_listItem'}
              mb={1}
              justifyContent="space-between"
              alignItems="center"
              padding="8px"
              opacity={isPaid ? 0.5 : 1}
              onClick={() => onToggleItem(listItem)}
            >
              <Flex justifyContent="space-between" flex={1}>
                <ItemName theme={theme}>{listItem.name.toLowerCase()}</ItemName>
                <ItemName theme={theme} textAlign="right" mr={2}>
                  {Math.round(listItem.amount)} zł
                </ItemName>
              </Flex>

              <Flex justifyContent="flex-end" style={{ color: 'var(--color-deepmain)' }}>
                <Checkbox
                  name={listItem.name}
                  value={listItem.name}
                  checked={checkedItems.includes(listItem.name)}
                />
              </Flex>
            </ListItem>
          );
        })}
      </Flex>
      <Sum
        style={{ borderTop: '2px solid gray' }}
        mt={3}
        py={3}
        fontSize={20}
        justifyContent="space-between"
      >
        <Box mr={4}>Zapłacone:</Box>
        <Box>{sumPaid} zł</Box>
      </Sum>
      <Sum fontWeight={700} pb={3} fontSize={20} justifyContent="space-between">
        <Box mr={4}>Niezapłacone:</Box>
        <Box>{sumUnPaid} zł</Box>
      </Sum>
    </>
  );
};

const Sum = styled(Flex)`
  color: var(--primary-color);
`;
