import React from 'react';
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';

import './App.css';
import Shopping from './components/Shopping';

import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';

function App() {
  return (
    <div className="App" style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
      <Router>
        <Routes>
          {/*<Route path="/" element={<Homepage />} />*/}
          <Route path="/" element={<Shopping />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
