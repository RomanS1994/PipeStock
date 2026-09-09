import React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';

import '../theme.css';
import './AppProviders.css';

export function AppProviders({ router, store }) {
  return (
    <div className="reactAppProviders">
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </div>
  );
}
