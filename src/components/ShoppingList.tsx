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
import styled from 'styled-components';

const ShoppingList = ({ listNumber, theme }: { listNumber: number; theme: string }) => {
  const [list, setList] = useState<Item[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Item[]>([]);
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState<string | Item>('');

  const [showModal, setShowModal] = useState<boolean>(false);
  const noItems = !list.length || !list.some((item) => ['0', '1'].includes(item.status));
  const [updatedItem, setUpdatedItem] = useState<Item | null>();

  useEffect(() => {
    getShoppingList();
    getAllItems();

    const sub = supabase
      .from('shopping')
      .on('*', (payload) => {
        const newItem = payload.new;
        if (newItem) {
          setUpdatedItem(newItem);
        }
      })
      .subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (updatedItem) {
      const _list = [...list];
      const itemToUpdate = _list.find((item) => item.uuid === updatedItem.uuid);
      if (itemToUpdate) {
        itemToUpdate.status = updatedItem.status;
        setList(_list);
      }
      setUpdatedItem(null);
    }
  }, [updatedItem]);

  const getShoppingList = () => {
    supabaseApi.getShoppingList(listNumber).then((res) => {
      if (res.data) {
        setList(res.data);
      }
    });
  };

  const getAllItems = () => {
    supabaseApi.getAllItems().then((res) => {
      const _data = res.data;
      if (_data) {
        setAllItems(res.data);
        setRecentlyAdded(
          _data
            .filter((item) => item.status === Status.IN_HISTORY)
            .slice(0, 15)
            .sort(({ name: name1 }, { name: name2 }) => name1.localeCompare(name2)),
        );
      }
    });
  };

  const addItem = () => {
    if (newItem) {
      const name = (typeof newItem === 'object' ? newItem.name : newItem).toLowerCase();
      const existingItem = allItems.find((i) => i.name.toLowerCase() === name);
      if (existingItem) {
        supabaseApi.updateItemStatus(existingItem.uuid, Status.IN_LIST, listNumber).then((res) => {
          if (res.data) {
            setNewItem('');
            setShowModal(false);
            getShoppingList();
          }
        });
      } else {
        const item: ItemForm = { name, status: Status.IN_LIST, list: listNumber };
        supabaseApi.createNewItem(item).then((res) => {
          if (res.data) {
            setNewItem('');
            setShowModal(false);
            getShoppingList();
          }
        });
      }
    }
  };

  const changeItemStatus = (itemId: string, status: Status) => {
    const _list = [...allItems];
    const itemToChange = _list.find((item) => item.uuid === itemId);
    if (itemToChange) {
      supabaseApi.updateItemStatus(itemToChange.uuid, status, listNumber).then(getShoppingList);
    }
  };

  const sortedList = useMemo(() => {
    return list.sort(
      ({ status: statusA }, { status: statusB }) => Number(statusA) - Number(statusB),
    );
  }, [list]);

  const searchItems = (event: any) => {
    let _suggestions;
    if (!event.query.trim().length) {
      _suggestions = [...allItems];
    } else {
      _suggestions = allItems
        .filter((item) => {
          return item.name.toLowerCase().startsWith(event.query.toLowerCase());
        })
        .map((item) => ({ ...item, name: item.name.toLowerCase() }));
    }
    setSuggestions(_suggestions);
  };

  const closeModal = () => {
    setShowModal(false);
    setNewItem('');
  };

  return (
    <Wrapper alignItems="center" flexDirection="column" flex={1}>
      {showModal ? (
        <Modal flexDirection="column" flex={1} className="modal-wrapper">
          <Flex flexDirection="column" flex={1}>
            <h4>Ostatnio dodawane:</h4>
            <Flex flexWrap="wrap">
              {recentlyAdded.map((item) => (
                <SmallItem
                  key={item.uuid}
                  onClick={() => changeItemStatus(item.uuid, Status.IN_LIST)}
                >
                  <Box>{item.name.toLowerCase()}</Box>
                </SmallItem>
              ))}
            </Flex>
          </Flex>
          <Flex flexDirection="column">
            <h4>Dodaj artykuł do listy: </h4>
            <AutoComplete
              value={newItem}
              suggestions={suggestions}
              field="name"
              autoFocus
              completeMethod={searchItems}
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
            <h5>Brak produktów</h5>
          ) : (
            <List flexDirection="column" mt={3} flex={1}>
              {sortedList
                .filter((i) => i.status !== Status.IN_HISTORY)
                .map((item) => {
                  const isInCart = item.status === Status.IN_CART;

                  return (
                    <ListItem
                      key={item.uuid + '_item'}
                      mb={2}
                      justifyContent="space-between"
                      alignItems="center"
                      inCart={isInCart}
                      onClick={() =>
                        changeItemStatus(item.uuid, isInCart ? Status.IN_HISTORY : Status.IN_CART)
                      }
                    >
                      <ItemName flex={5} inCart={isInCart} theme={theme}>
                        {item.name.toLowerCase()}
                      </ItemName>
                      <Flex
                        flex={1}
                        justifyContent="flex-end"
                        style={{ color: 'var(--color-deepmain)' }}
                      >
                        {item.status === Status.IN_CART ? (
                          <RemoveButton
                            ml={2}
                            onClick={() => changeItemStatus(item.uuid, Status.IN_HISTORY)}
                            justifyContent="center"
                            alignItems="center"
                          >
                            x
                          </RemoveButton>
                        ) : (
                          <Cart width={20} height={20} />
                        )}
                      </Flex>
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

const SmallItem = styled.div`
  background-color: var(--color-deepmain);
  color: white;
  padding: 4px 6px;
  border-radius: 3px;
  margin: 2px;
  cursor: pointer;
`;

export default ShoppingList;
