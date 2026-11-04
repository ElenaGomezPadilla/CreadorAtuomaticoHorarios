import React from 'react';
import { createRoot } from 'react-dom/client'; 

import './style/main.css';

const App = () => {
  return <h1>Hello World!</h1>;
};

const root = createRoot(document.getElementById('app')); 
root.render(<App />); 
