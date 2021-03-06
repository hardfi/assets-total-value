import React, {useEffect, useState } from 'react';
import {Box, Flex } from 'rebass';
import styled from 'styled-components';
import { ReactComponent as Cart } from '../assets/shopping-cart.svg';
import {getFromLocalStorage, LocalStorageKeys, saveToLocalStorage } from '../utils/functions';
import Background from '../assets/bckg.jpeg';
import supabaseApi from '../api/supabaseApi';
import { Item, ItemForm, Optional, Status } from '../api/typings';

const ShoppingList = () => {
    const [list, setList] = useState<Item[]>([]);
    const [newItem, setNewItem] = useState<string>('');

    const [showModal, setShowModal] = useState<boolean>(false);
    const noItems = !list.length;

    useEffect(() => {
        getShoppingList();
    }, []);

    const getShoppingList = () => {
        supabaseApi.getAllItems().then(res => {
            if (res.data) {
                setList(res.data);
            }
        });
    }

    const addItem = () => {
        if (newItem) {
            const item: ItemForm = {name: newItem, status: Status.IN_LIST}
            supabaseApi.createNewItem(item).then(res => {
                if (res.data) {
                    setNewItem('');
                    setShowModal(false);
                    getShoppingList();
                }
            })
        }
    }

    const changeItemStatus = (itemId: string, status: Status) => {
        const _list = [...list];
        const itemToChange = _list.find(item => item.uuid === itemId);
        if (itemToChange) {
            supabaseApi.updateItemStatus(itemToChange.uuid, status).then(res => {
                if (res.data) {
                    getShoppingList();
                }
            })
        }
    }

    const returnSortedList = (itemList: Item[]) => {
        return itemList.sort(({status: inCartA}, {status: inCartB}) => inCartA === inCartB ? 0 : inCartA ? 1 : -1);
    }

    const closeModal = () => {
        setShowModal(false);
        setNewItem('');
    }

    return (
        <Wrapper alignItems="center" flexDirection="column" flex={1} height="100vh">
            {showModal ? (
                <Modal flexDirection="column" flex={1}>
                    <Flex flexDirection="column" flex={1}>
                        <h4>Ostatnio dodawane:</h4>
                        <Flex flexWrap="wrap">
                            {list.filter(item => item.status === Status.IN_HISTORY).map(item => (
                                <SmallItem key={item.uuid} onClick={() => changeItemStatus(item.uuid, Status.IN_LIST)}>
                                    <Box>{item.name}</Box>
                                </SmallItem>
                            ))}
                        </Flex>
                    </Flex>
                    <Flex flexDirection="column">
                        <h4>Dodaj artyku?? do listy: </h4>
                        <Input onKeyDown={(e) => e.key === "Enter" ? addItem() : null} autoFocus={true} type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}/>
                        <Flex justifyContent="flex-end" mt={2}>
                            <Button style={{backgroundColor: 'grey', marginRight: 4}} onClick={closeModal}>Wr????</Button>
                            <Button onClick={addItem}>+ Dodaj</Button>
                        </Flex>
                    </Flex>
                </Modal>
            ) : (
                <Flex flexDirection="column" width="100%" flex={1}>
                    <h2>Lista zakup??w Sandry</h2>
                    {noItems ? (
                        <h5>Brak produkt??w</h5>
                    ) : (
                        <List flexDirection="column" mt={3} flex={1}>
                            {list.filter(i => i.status !== Status.IN_HISTORY).map(item => {
                                const isInCart = item.status === Status.IN_CART;

                                return (
                                    <ListItem key={item.uuid + '_item'} mb={2} justifyContent="space-between" alignItems="center" inCart={isInCart} onClick={() => changeItemStatus(item.uuid, isInCart ? Status.IN_HISTORY : Status.IN_CART)}>
                                        <ItemName flex={5} inCart={isInCart} >{item.name}</ItemName>
                                        <Flex flex={1} justifyContent="flex-end" style={{color: 'deeppink'}}>
                                            {item.status === Status.IN_CART ? (
                                                <RemoveButton ml={2} onClick={() => changeItemStatus(item.uuid, Status.IN_HISTORY)} justifyContent="center" alignItems="center">x</RemoveButton>
                                            ) : (
                                                <Cart width={20} height={20} />
                                            )}
                                        </Flex>
                                    </ListItem>
                                )
                            })}
                        </List>
                    )}
                    <Flex mb={4} width="100%">
                        <Button onClick={() => setShowModal(true)} style={{width: '100%'}}>+ Dodaj produkt</Button>
                    </Flex>
                </Flex>
            )}
        </Wrapper>
    );
}

const Wrapper = styled(Flex)`
  --color-pink: pink;
  --color-lightpink: rgba(255, 192, 203, 0.3);
  --color-deeppink: deeppink;
  padding: 40px 26px;
  max-width: 500px;
  // background: url(${Background});
  //background-size: cover;
`;

const List = styled(Flex)``;

const ListItem = styled(Flex)<{inCart?: boolean}>`
  padding: 12px;
  border-radius: 6px;
  background-color: ${({inCart}) => inCart ? 'var(--color-lightpink)' : 'var(--color-pink)'};
`;

const Modal = styled(Flex)`
  margin: 0;
  z-index: 99;
  width: 100vw;
  height: 100wh;
  background-color: white;
  padding: 40px;
  max-width: 500px;
`;

const Input = styled.input`
  height: 40px;
  font-size: 20px;
  border: none;
  padding: 6px 12px;
  outline: none;
  border-width: 1px;
  border-bottom: 1px solid black;
`;

const ItemName = styled(Flex)<{inCart?: boolean}>`
  word-break: break-word;
  text-align: left;
  text-decoration: ${({inCart}) => inCart ? 'line-through' : 'none'};
`;

const Button = styled.button`
  background-color: var(--color-deeppink);
  font-weight: bold;
  height: 46px;
  border-radius: 6px;
  padding: 6px 12px;
  outline: none;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 18px;
`;

const RemoveButton = styled(Flex)`
  background-color: var(--color-deeppink); 
  border-radius: 100%; 
  width: 20px; 
  height: 20px; 
  color: white;
  font-weight: bold;
  font-size: 14px;
  padding-bottom: 1px;
`;

const SmallItem = styled.div`
  background-color: var(--color-deeppink);
  color: white;
  padding: 4px 6px;
  border-radius: 3px;
  margin: 2px;
`;

export default ShoppingList;
