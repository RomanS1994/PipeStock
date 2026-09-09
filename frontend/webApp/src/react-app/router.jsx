import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { App } from '@shared/app/App.jsx';
import { HomePage } from './pages/HomePage/HomePage.jsx';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
]);
