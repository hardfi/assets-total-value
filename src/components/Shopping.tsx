import React, {useState} from "react";
import {Flex} from "rebass";
import ShoppingList from "./ShoppingList";
import {TabPanel, TabView} from "primereact/tabview";
import styled from "styled-components";

const Shopping = () => {
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

    return (
        <Wrapper className="card" width="100vw">
            <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
                <TabPanel header="Codzienne">
                    <ShoppingList listNumber={0} />
                </TabPanel>
                <TabPanel header="Budowa">
                    <ShoppingList listNumber={1} />
                </TabPanel>
                <TabPanel header="Inne">
                    <ShoppingList listNumber={2} />
                </TabPanel>
            </TabView>
        </Wrapper>
    )
}

const Wrapper = styled(Flex)`
  --color-pink: pink;
  --color-lightpink: rgba(255, 192, 203, 0.3);
  --color-deeppink: deeppink;
  
  .p-tabview {
    width: 100%;
  }

  .p-tabview .p-tabview-nav li .p-tabview-nav-link:not(.p-disabled):focus {
    box-shadow: none;
  }
`;

export default Shopping;