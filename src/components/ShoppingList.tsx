import React, {useEffect, useMemo, useState} from 'react';
import {Box, Flex} from 'rebass';
import styled from 'styled-components';
import {ReactComponent as Cart} from '../assets/shopping-cart.svg';
import supabaseApi from '../api/supabaseApi';
import {Item, ItemForm, Status} from '../api/typings';
import {Button} from "./common/Button";
import {RoundButton} from "./common/RoundButton";
import {AutoComplete} from "primereact/autocomplete";

const ShoppingList = ({listNumber}: {listNumber: number}) => {
    const [list, setList] = useState<Item[]>([]);
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [recentlyAdded, setRecentlyAdded] = useState<Item[]>([]);
    const [suggestions, setSuggestions] = useState<Item[]>([]);
    const [newItem, setNewItem] = useState<string | Item>('');

    const [showModal, setShowModal] = useState<boolean>(false);
    const noItems = !list.length;

    useEffect(() => {
        getShoppingList();
        getAllItems();
    }, []);

    const getShoppingList = () => {
        supabaseApi.getShoppingList(listNumber).then(res => {
            if (res.data) {
                setList(res.data);
            }
        });
    }

    const getAllItems = () => {
        supabaseApi.getAllItems().then(res => {
            const _data = res.data;
            if (_data) {
                setAllItems(res.data);
                setRecentlyAdded(
                    _data.filter(item => item.status === Status.IN_HISTORY)
                        .slice(0, 15)
                        .sort(({name: name1}, {name: name2}) => name1.localeCompare(name2))
                )
            }
        })
    }

    const addItem = () => {
        if (newItem) {
            const name = (typeof newItem === "object" ? newItem.name : newItem).toLowerCase();
            const existingItem = allItems.find(i => i.name.toLowerCase() === name);
            if (existingItem) {
                supabaseApi.updateItemStatus(existingItem.uuid, Status.IN_LIST, listNumber).then(res => {
                    if (res.data) {
                        setNewItem('');
                        setShowModal(false);
                        getShoppingList();
                    }
                });
            } else {
            const item: ItemForm = {name, status: Status.IN_LIST, list: listNumber}
            supabaseApi.createNewItem(item).then(res => {
                if (res.data) {
                    setNewItem('');
                    setShowModal(false);
                    getShoppingList();
                }
            })
            }
        }
    }

    const changeItemStatus = (itemId: string, status: Status) => {
        const _list = [...list];
        const itemToChange = _list.find(item => item.uuid === itemId);
        if (itemToChange) {
            supabaseApi.updateItemStatus(itemToChange.uuid, status, listNumber).then(res => {
                if (res.data) {
                    getShoppingList();
                }
            })
        }
    }

    const sortedList = useMemo(() => {
        return list.sort((
            {status: statusA},
            {status: statusB}
        ) => Number(statusA) - Number(statusB));
    }, [list]);

    const searchItems = (event: any) => {
            let _suggestions;
            if (!event.query.trim().length) {
                _suggestions = [...allItems];
            } else {
                _suggestions = allItems.filter((item) => {
                    return item.name.toLowerCase().startsWith(event.query.toLowerCase());
                });
            }
            setSuggestions(_suggestions);
    }

    const closeModal = () => {
        setShowModal(false);
        setNewItem('');
    }

    return (
        <Wrapper alignItems="center" flexDirection="column" flex={1}>
            {showModal ? (
                <Modal flexDirection="column" flex={1}>
                    <Flex flexDirection="column" flex={1}>
                        <h4>Ostatnio dodawane:</h4>
                        <Flex flexWrap="wrap">
                            {recentlyAdded.map(item => (
                                <SmallItem key={item.uuid} onClick={() => changeItemStatus(item.uuid, Status.IN_LIST)}>
                                    <Box>{item.name.toLowerCase()}</Box>
                                </SmallItem>
                            ))}
                        </Flex>
                    </Flex>
                    <AddArticleWrapper flexDirection="column">
                        <h4>Dodaj artykuł do listy: </h4>
                        <AutoComplete value={newItem}
                                      suggestions={suggestions}
                                      field="name"
                                      style={{width: '100%'}}
                                      completeMethod={searchItems}
                                      onChange={(e) => setNewItem(e.target.value)}/>
                        <Flex justifyContent="flex-end" mt={4}>
                            <Button style={{backgroundColor: 'grey', marginRight: 4}} onClick={closeModal}>Wróć</Button>
                            <Button onClick={addItem}>+ Dodaj</Button>
                        </Flex>
                    </AddArticleWrapper>
                </Modal>
            ) : (
                <Flex flexDirection="column" width="100%" flex={1}>
                    {noItems ? (
                        <h5>Brak produktów</h5>
                    ) : (
                        <List flexDirection="column" mt={3} flex={1}>
                            {sortedList.filter(i => i.status !== Status.IN_HISTORY).map(item => {
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
                        <RoundButton onClick={() => setShowModal(true)}>+</RoundButton>
                    </Flex>
                </Flex>
            )}
        </Wrapper>
    );
}

const Wrapper = styled(Flex)`
  max-width: 100vw;
  
  .p-autocomplete input {
    width: 100%;
  }
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
  height: 100vh;
  background-color: white;
  padding: 40px;
  max-width: 500px;
`;

const ItemName = styled(Flex)<{inCart?: boolean}>`
  word-break: break-word;
  text-align: left;
  text-decoration: ${({inCart}) => inCart ? 'line-through' : 'none'};
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

const AddArticleWrapper = styled(Flex)`
  position: fixed;
  bottom: 50px;
  width: 80vw;
`;

export default ShoppingList;
