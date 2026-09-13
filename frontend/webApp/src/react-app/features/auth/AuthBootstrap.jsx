import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { baseApi } from '@shared/app/api/baseApi.js';
import { clearSession, markHydrated, selectAuth, setSession } from './authSlice.js';
import { useCurrentUserQuery, useRefreshSessionMutation } from './authApi.js';

const AUTH_STORAGE_KEY = 'pipestock_auth';

function authScope(user) {
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE' && item.company);
  return [user?.id || '', membership?.id || '', membership?.role || '', membership?.company?.id || ''].join(':');
}

export function AuthBootstrap() {
  const dispatch = useDispatch();
  const { token, user } = useSelector(selectAuth);
  const attemptedRefresh = useRef(false);
  const [refreshSession] = useRefreshSessionMutation();
  const currentUser = useCurrentUserQuery(undefined, { skip: !token });
  const currentScope = authScope(user);

  useEffect(() => {
    function clearLocalSession() {
      dispatch(clearSession());
      dispatch(baseApi.util.resetApiState());
    }

    function handleStorage(event) {
      if (event.key !== AUTH_STORAGE_KEY) return;
      if (!event.newValue) {
        clearLocalSession();
        return;
      }

      try {
        const value = JSON.parse(event.newValue);
        if (value.token && value.user) {
          const nextScope = authScope(value.user);
          if (nextScope !== currentScope) dispatch(baseApi.util.resetApiState());
          dispatch(setSession({ token: value.token, user: value.user }));
        } else {
          clearLocalSession();
        }
      } catch {
        clearLocalSession();
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [dispatch, currentScope]);

  useEffect(() => {
    if (token) {
      if (currentUser.isSuccess || currentUser.isError) dispatch(markHydrated());
      return;
    }

    if (attemptedRefresh.current) return;
    attemptedRefresh.current = true;
    refreshSession().unwrap().catch(() => {}).finally(() => dispatch(markHydrated()));
  }, [token, currentUser.isSuccess, currentUser.isError, refreshSession, dispatch]);

  return null;
}
