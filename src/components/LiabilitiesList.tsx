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

import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import styled from 'styled-components';

type Props = {
  theme: string;
};

export const LiabilitiesList = ({ theme }: Props) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [list, setList] = useState<LiabilityItem[]>([]);
  const [unselectedList, setUnselectedList] = useState<LiabilityItem[]>([]);
  const [sum, setSum] = useState<string>('');
  const [yearlySum, setYearlySum] = useState<string>('');

  const [item, setItem] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    getLiabilitiesList();
  }, []);

  useEffect(() => {
    updateSum();
  }, [list, unselectedList]);

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

  const addItem = () => {
    if (item && amount) {
      const itemForm = {
        name: item,
        amount: +amount,
      };
      supabaseApi.addNewLiabilityItem(itemForm).then((res) => {
        if (res.data) {
          setItem('');
          setShowModal(false);
          getLiabilitiesList();
        }
      });
    }
  };

  const updateSum = () => {
    const _sum = list.reduce((total, item) => {
      if (unselectedList.find((unselected) => unselected.uuid === item.uuid)) {
        return total;
      } else {
        return total + +item.amount;
      }
    }, 0);
    const yearlySum = unselectedList.reduce((sum, item) => (sum += item.amount), 0);
    setSum(String(parseInt(String(_sum))));
    setYearlySum(String(parseInt(String(yearlySum))));
  };

  const removeItem = (uuid: string) => {
    supabaseApi
      .removeLiabilityItem(uuid)
      .then(() => {
        getLiabilitiesList();
      })
      .catch((err) => console.log(err));
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
    <div>
      {showModal ? (
        <Modal flexDirection="column" flex={1} className="modal-wrapper" padding={0}>
          <Flex flexDirection="column">
            <h4>Dodaj do listy: </h4>
            <Box mb={2} width="100%">
              <InputText
                value={item}
                autoFocus
                onChange={(e) => setItem(e.target.value)}
                placeholder="nazwa"
                style={{
                  width: '100%',
                }}
              />
            </Box>
            <InputText
              value={amount}
              type={'number'}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="kwota"
            />
            <Flex justifyContent="flex-end" mt={4}>
              <Button
                style={{ backgroundColor: 'grey', marginRight: 4 }}
                onClick={() => setShowModal(false)}
              >
                Wróć
              </Button>
              <Button onClick={addItem}>+ Dodaj</Button>
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <>
          <Flex flexDirection="column" mt={3} flex={1}>
            {list.map((listItem) => {
              const isUnselected = unselectedList.find((item) => item.uuid === listItem.uuid);
              return (
                <ListItem
                  key={listItem.uuid + '_listItem'}
                  mb={1}
                  justifyContent="space-between"
                  alignItems="center"
                  padding="8px"
                  opacity={isUnselected ? 0.5 : 1}
                  onClick={() => toggleSelected(listItem)}
                >
                  <Flex justifyContent="space-between" flex={1}>
                    <ItemName theme={theme}>{listItem.name.toLowerCase()}</ItemName>
                    <ItemName theme={theme} textAlign="right" mr={2}>
                      {Math.round(listItem.amount)} zł
                    </ItemName>
                  </Flex>

                  <Flex justifyContent="flex-end" style={{ color: 'var(--color-deepmain)' }}>
                    <RemoveButton
                      ml={2}
                      onClick={() => removeItem(listItem.uuid!)}
                      justifyContent="center"
                      alignItems="center"
                    >
                      x
                    </RemoveButton>
                  </Flex>
                </ListItem>
              );
            })}
          </Flex>
          <Sum fontWeight={700} style={{ borderTop: '2px solid gray' }} mt={3} py={3} fontSize={20}>
            <Box mr={4}>SUMA:</Box>
            <Box>{sum} zł</Box>
          </Sum>
          <Yearly mb="120px">
            <Box mr={3}>Zaznaczone rocznie:</Box>
            <Box>{yearlySum} zł</Box>
          </Yearly>
          <RoundButton
            onClick={() => setShowModal(true)}
            theme={theme}
            style={{
              opacity: 0.86,
            }}
          >
            +
          </RoundButton>
        </>
      )}
    </div>
  );
};

const Sum = styled(Flex)`
  color: var(--primary-color);
`;

const Yearly = styled(Flex)`
  color: var(--primary-color);
`;
