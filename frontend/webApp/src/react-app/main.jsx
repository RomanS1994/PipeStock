import React from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@shared/app/providers/AppProviders.jsx';
import { AuthBootstrap } from './features/auth/AuthBootstrap.jsx';
import { router } from './router.jsx';
import { store } from './store.js';

const RETURN_CONTEXT_KEY = 'pipestock:return-to-worktrack';

function WorkTrackReturn() {
  const [launchedFromWorkTrack] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    const launched = params.get('from') === 'worktrack' &&
      window.location.pathname.startsWith('/pipestock');
    if (launched) {
      window.sessionStorage.setItem(RETURN_CONTEXT_KEY, '1');
      // Keep the marker out of subsequent copied/shared PipeStock URLs.
      params.delete('from');
      const search = params.toString();
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`);
    }
    return window.sessionStorage.getItem(RETURN_CONTEXT_KEY) === '1' &&
      window.location.pathname.startsWith('/pipestock');
  });
  const pathname = React.useSyncExternalStore(
    router.subscribe,
    () => router.state.location.pathname,
  );

  // The return control belongs to the home screen, not every PipeStock page.
  if (!launchedFromWorkTrack || pathname !== '/dashboard') return null;

  return (
    <a
      href="/partners"
      onClick={() => window.sessionStorage.removeItem(RETURN_CONTEXT_KEY)}
      style={{ position: 'fixed', top: 'max(12px, env(safe-area-inset-top))', left: 12, zIndex: 10000, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 999, background: '#ffffff', color: '#172a24', border: '1px solid #dce8e1', boxShadow: '0 4px 16px rgba(0,0,0,.12)', font: '600 14px system-ui, sans-serif', textDecoration: 'none' }}
    >
      <span aria-hidden="true">←</span> WorkTrack
    </a>
  );
}

const rootElement = document.getElementById('react-root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <WorkTrackReturn />
      <AppProviders router={router} store={store} bootstrap={<AuthBootstrap />} />
    </React.StrictMode>,
  );
}
