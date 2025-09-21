import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Custom system config with professional colors matching the current design
const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#e6f3ff' },
          100: { value: '#bae0ff' },
          200: { value: '#8dccff' },
          300: { value: '#60b8ff' },
          400: { value: '#3498db' }, // Current primary blue
          500: { value: '#2980b9' }, // Darker blue
          600: { value: '#206ba4' },
          700: { value: '#18568f' },
          800: { value: '#0f417a' },
          900: { value: '#062c65' },
        },
        success: {
          400: { value: '#27ae60' }, // Current green
          500: { value: '#229954' },
        },
        danger: {
          400: { value: '#e74c3c' }, // Current red
          500: { value: '#c0392b' },
        },
        dark: {
          400: { value: '#2c3e50' }, // Current dark header
          500: { value: '#34495e' }, // Navigation color
        },
      }
    }
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
