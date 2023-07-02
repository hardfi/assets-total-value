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
import styled from 'styled-components';

type Props = {
  theme: string;
};

export const LiabilitiesList = ({ theme }: Props) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [list, setList] = useState<LiabilityItem[]>([]);
  const [sum, setSum] = useState<string>('');

  const [item, setItem] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    getLiabilitiesList();
  }, []);

  useEffect(() => {
    updateSum();
  }, [list]);

  const getLiabilitiesList = () => {
    supabaseApi.getLiabilitiesList().then((res) => {
      if (res.data) {
        setList(res.data);
      }
    });
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
    const _sum = list.reduce((total, item) => (total += +item.amount), 0);
    setSum(String(parseInt(String(_sum))));
  };

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
            {list.map((listItem) => (
              <ListItem
                key={listItem.uuid + '_listItem'}
                mb={1}
                justifyContent="space-between"
                alignItems="center"
                padding="8px"
              >
                <Flex justifyContent="space-between" flex={1}>
                  <ItemName theme={theme}>{listItem.name.toLowerCase()}</ItemName>
                  <ItemName theme={theme} textAlign="right" mr={2}>
                    {listItem.amount} zł
                  </ItemName>
                </Flex>

                <Flex justifyContent="flex-end" style={{ color: 'var(--color-deepmain)' }}>
                  <RemoveButton
                    ml={2}
                    onClick={() => console.log('on remove')}
                    justifyContent="center"
                    alignItems="center"
                  >
                    x
                  </RemoveButton>
                </Flex>
              </ListItem>
            ))}
          </Flex>

          <Sum
            fontWeight={700}
            style={{ borderTop: '2px solid gray' }}
            my={3}
            py={3}
            justifyContent="space-between"
            fontSize={20}
          >
            <Box>SUMA:</Box>
            <Box>{sum} zł</Box>
          </Sum>
          <RoundButton onClick={() => setShowModal(true)} theme={theme}>
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
