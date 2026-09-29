import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { baseApi } from '../api/baseApi.js';
import { RouterProvider } from 'react-router-dom';

import '../theme.css';
import './AppProviders.css';

function NetworkActivityIndicator() {
  const hasPendingRequests = useSelector(state => {
    const apiState = state[baseApi.reducerPath];
    if (!apiState) return false;

    return [
      ...Object.values(apiState.queries || {}),
      ...Object.values(apiState.mutations || {}),
    ].some(request => request?.status === 'pending');
  });
  const [hasExternalPendingRequests, setHasExternalPendingRequests] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const isPending = hasPendingRequests || hasExternalPendingRequests;

  React.useEffect(() => {
    let externalPendingCount = 0;
    const handleActivity = event => {
      externalPendingCount = Math.max(
        0,
        externalPendingCount + (event.detail?.active ? 1 : -1),
      );
      setHasExternalPendingRequests(externalPendingCount > 0);
    };

    window.addEventListener('pipestock:network-activity', handleActivity);
    return () => window.removeEventListener('pipestock:network-activity', handleActivity);
  }, []);

  React.useEffect(() => {
    if (!isPending) {
      setIsVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setIsVisible(true), 180);
    return () => window.clearTimeout(timer);
  }, [isPending]);

  return (
    <div
      className={`networkActivity${isVisible ? ' is-visible' : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!isVisible}
    >
      <span className="networkActivity-spinner" aria-hidden="true" />
      <span>Завантаження…</span>
    </div>
  );
}

export function AppProviders({ router, store, bootstrap = null }) {
  return (
    <div className="reactAppProviders">
      <Provider store={store}>
        <NetworkActivityIndicator />
        {bootstrap}
        <RouterProvider router={router} />
      </Provider>
    </div>
  );
}
