import React from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@shared/app/providers/AppProviders.jsx';
import { AuthBootstrap } from './features/auth/AuthBootstrap.jsx';
import { router } from './router.jsx';
import { store } from './store.js';

const rootElement = document.getElementById('react-root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AppProviders router={router} store={store} bootstrap={<AuthBootstrap />} />
    </React.StrictMode>,
  );
}
