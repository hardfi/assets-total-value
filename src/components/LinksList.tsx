import React, { useEffect, useMemo, useState } from 'react';

import { Box, Flex } from 'rebass';

import { ReactComponent as Cart } from '../assets/shopping-cart.svg';

import supabase from '../api/supabase';
import supabaseApi from '../api/supabaseApi';
import { Item, ItemForm, Status } from '../api/typings';
import { Button } from './common/Button';
import { ItemName } from './common/ItemName';
import { ListItem } from './common/ListItem';
import { Modal } from './common/Modal';
import { RemoveButton } from './common/RemoveButton';
import { RoundButton } from './common/RoundButton';

import { AutoComplete } from 'primereact/autocomplete';
import { ProgressSpinner } from 'primereact/progressspinner';
import styled from 'styled-components';

const ShoppingList = ({ listNumber, theme }: { listNumber: number; theme: string }) => {
  const [list, setList] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState<string | Item>('');

  const [showModal, setShowModal] = useState<boolean>(false);
  const noItems = !list.length || !list.some((item) => ['0', '1'].includes(item.status));

  useEffect(() => {
    getShoppingList();
  }, []);

  const getShoppingList = () => {
    supabaseApi.getShoppingList(listNumber).then((res) => {
      if (res.data) {
        setList(res.data);
      }
    });
  };

  const addItem = () => {
    if (newItem) {
      const name = (typeof newItem === 'object' ? newItem.name : newItem).toLowerCase();
      const item: ItemForm = { name, status: Status.IN_LIST, list: listNumber };
      supabaseApi.createNewItem(item).then((res) => {
        if (res.data) {
          setNewItem('');
          setShowModal(false);
          getShoppingList();
        }
      });
    }
  };

  const sortedList = useMemo(() => {
    return list.sort(
      ({ status: statusA }, { status: statusB }) => Number(statusA) - Number(statusB),
    );
  }, [list]);

  const linkList = useMemo(() => {
    return sortedList
      .filter((item) => item.name.indexOf('http') === 0)
      .map((item) => ({
        ...item,
        url: new URL(item.name),
      }));
  }, [sortedList]);

  const closeModal = () => {
    setShowModal(false);
    setNewItem('');
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
    <Wrapper alignItems="center" flexDirection="column" flex={1}>
      {showModal ? (
        <Modal
          flexDirection="column"
          flex={1}
          className="modal-wrapper"
          justifyContent="flex-end"
          pb="120px"
        >
          <Flex flexDirection="column">
            <h4>Dodaj link do listy: </h4>
            <AutoComplete
              value={newItem}
              field="name"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addItem();
                }
              }}
              onChange={(e) => setNewItem(e.target.value)}
            />
            <Flex justifyContent="flex-end" mt={4}>
              <Button style={{ backgroundColor: 'grey', marginRight: 4 }} onClick={closeModal}>
                Wróć
              </Button>
              <Button onClick={addItem}>+ Dodaj</Button>
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <Flex flexDirection="column" width="100%" flex={1}>
          {noItems ? (
            <h5>Brak linków</h5>
          ) : (
            <List flexDirection="column" mt={3} flex={1}>
              {linkList
                .filter((i) => i.status !== Status.IN_HISTORY)
                .map((item) => {
                  const isInCart = item.status === Status.IN_CART;

                  return (
                    <ListItem
                      key={item.uuid + '_item'}
                      padding="6px 12px"
                      mb={2}
                      justifyContent="space-between"
                      alignItems="center"
                      inCart={isInCart}
                      onClick={() => window.open(item.url, '_blank', 'noopener noreferrer')}
                      flexDirection="column"
                    >
                      <ItemName flex={5} inCart={isInCart} theme={theme}>
                        {item.url.hostname}
                      </ItemName>
                      <span
                        style={{
                          fontSize: '10px',
                          color: theme === 'pink' ? 'var(--gray-700)' : 'white',
                          wordBreak: 'break-all',
                          marginTop: '4px',
                          lineHeight: '94%',
                          fontWeight: 300,
                        }}
                      >
                        {item.url.href}
                      </span>
                    </ListItem>
                  );
                })}
            </List>
          )}
          <Flex mb={4} width="100%">
            <RoundButton onClick={() => setShowModal(true)} theme={theme}>
              +
            </RoundButton>
          </Flex>
        </Flex>
      )}
    </Wrapper>
  );
};

const Wrapper = styled(Flex)`
  max-width: 100vw;

  .p-autocomplete input {
    width: 100%;
  }
`;

const List = styled(Flex)``;

export default ShoppingList;
