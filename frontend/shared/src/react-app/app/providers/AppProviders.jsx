import React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';

import '../theme.css';
import './AppProviders.css';

export function AppProviders({ router, store, bootstrap = null }) {
  return (
    <div className="reactAppProviders">
      <Provider store={store}>
        {bootstrap}
        <RouterProvider router={router} />
      </Provider>
    </div>
  );
}
