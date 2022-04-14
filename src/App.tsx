import React from 'react';

import './App.css';
import CurrencyAssets from './components/CurrencyAssets';

import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import ShoppingList from './components/ShoppingList';
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";

function App() {
  return (
    <div className="App" style={{display: 'flex', justifyContent: 'center', minHeight: '100vh'}}>
        <Router>
            <Routes>
                <Route path="/" element={ <ShoppingList/> } />
                {/*<Route path="/fx" element={ <CurrencyAssets/> } />*/}
            </Routes>
        </Router>
    </div>
  );
}

export default App;
