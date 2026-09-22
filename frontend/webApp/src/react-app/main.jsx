import React from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@shared/app/providers/AppProviders.jsx';
import { AuthBootstrap } from './features/auth/AuthBootstrap.jsx';
import { router } from './router.jsx';
import { store } from './store.js';

const RETURN_CONTEXT_KEY = 'pipestock:return-to-worktrack';

function WorkTrackLaunchContext() {
  React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'worktrack' && window.location.pathname.startsWith('/pipestock')) {
      window.sessionStorage.setItem(RETURN_CONTEXT_KEY, '1');
      params.delete('from');
      const search = params.toString();
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`);
    }
    return null;
  });
  return null;
}

const rootElement = document.getElementById('react-root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <WorkTrackLaunchContext />
      <AppProviders router={router} store={store} bootstrap={<AuthBootstrap />} />
    </React.StrictMode>,
  );
}
