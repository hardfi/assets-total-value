import React, {useEffect, useState } from 'react';
import {Box, Flex } from 'rebass';
import styled from 'styled-components';
import { ReactComponent as Cart } from '../assets/shopping-cart.svg';
import {getFromLocalStorage, LocalStorageKeys, saveToLocalStorage } from '../utils/functions';
import Background from '../assets/bckg.jpeg';

type Item = {
    name: string;
    id: number;
    status: Status;
}

enum Status {
    IN_LIST,
    IN_CART,
    IN_HISTORY
}

const ShoppingList = () => {
    const [list, setList] = useState<Item[]>([]);
    const [newItem, setNewItem] = useState<string>('');

    const [showModal, setShowModal] = useState<boolean>(false);
    const noItems = !list.length;

    useEffect(() => {
        const savedList: Item[] = getFromLocalStorage(LocalStorageKeys.SHOPPING_LIST);
        if (savedList) {
            setList(savedList);
        }
    }, []);

    useEffect(() => {
        saveToLocalStorage(JSON.stringify(list), LocalStorageKeys.SHOPPING_LIST)
    }, [list]);

    const addItem = () => {
        if (newItem) {
            setList(returnSortedList([...list, {name: newItem, id: Date.now(), status: Status.IN_LIST}]));
            setNewItem('');
            setShowModal(false);
        }
    }

    const returnSortedList = (itemList: Item[]) => {
        return itemList.sort(({status: inCartA}, {status: inCartB}) => inCartA === inCartB ? 0 : inCartA ? 1 : -1);
    }

    const closeModal = () => {
        setShowModal(false);
        setNewItem('');
    }

    const changeItemStatus = (itemId: number, status: Status) => {
        const _list = [...list];
        const itemToChange = _list.find(item => item.id === itemId);
        if (itemToChange) {
            itemToChange.status = status;
        }
        setList(returnSortedList(_list));
    }

    return (
        <Wrapper alignItems="center" flexDirection="column" flex={1} height="100vh">
            {showModal ? (
                <Modal flexDirection="column" flex={1}>
                    <Flex flexDirection="column" flex={1}>
                        <h4>Ostatnio dodawane:</h4>
                        <Flex flexWrap="wrap">
                            {list.filter(item => item.status === Status.IN_HISTORY).map(item => (
                                <SmallItem key={item.id} onClick={() => changeItemStatus(item.id, Status.IN_LIST)}>
                                    <Box>{item.name}</Box>
                                </SmallItem>
                            ))}
                        </Flex>
                    </Flex>
                    <Flex flexDirection="column">
                        <h4>Dodaj artykuł do listy: </h4>
                        <Input autoFocus={true} type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}/>
                        <Flex justifyContent="flex-end" mt={2}>
                            <Button style={{backgroundColor: 'grey', marginRight: 4}} onClick={closeModal}>Wróć</Button>
                            <Button onClick={addItem}>+ Dodaj</Button>
                        </Flex>
                    </Flex>
                </Modal>
            ) : (
                <Flex flexDirection="column" width="100%" flex={1}>
                    <h2>Lista zakupów Sandry</h2>
                    {noItems ? (
                        <h5>Brak produktów</h5>
                    ) : (
                        <List flexDirection="column" mt={3} flex={1}>
                            {list.filter(i => i.status !== Status.IN_HISTORY).map(item => {
                                const isInCart = item.status === Status.IN_CART;

                                return (
                                    <ListItem key={item.id + '_item'} mb={2} justifyContent="space-between" alignItems="center" inCart={isInCart}>
                                        <ItemName flex={5} inCart={isInCart} >{item.name}</ItemName>
                                        <Flex flex={1} justifyContent="flex-end" style={{color: 'deeppink'}}>
                                            {item.status === Status.IN_CART ? (
                                                <RemoveButton ml={2} onClick={() => changeItemStatus(item.id, Status.IN_HISTORY)} justifyContent="center" alignItems="center">x</RemoveButton>
                                            ) : (
                                                <Cart onClick={() => changeItemStatus(item.id, Status.IN_CART)} width={20} height={20} />
                                            )}
                                        </Flex>
                                    </ListItem>
                                )
                            })}
                        </List>
                    )}
                    <Button onClick={() => setShowModal(true)}>+ Dodaj produkt</Button>
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
  font-size: 18px;
  border-radius: 3px;
  padding: 6px 12px;
  outline: none;
  border-width: 1px;
`;

const ItemName = styled(Flex)<{inCart?: boolean}>`
  word-break: break-word;
  text-align: left;
  text-decoration: ${({inCart}) => inCart ? 'line-through' : 'none'};
`;

const Button = styled.button`
  background-color: var(--color-deeppink);
  font-weight: bold;
  height: 36px;
  border-radius: 6px;
  padding: 6px 12px;
  outline: none;
  border: none;
  cursor: pointer;
  color: white;
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
