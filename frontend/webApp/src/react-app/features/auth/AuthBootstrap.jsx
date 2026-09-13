import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearSession, markHydrated, selectAuth, setSession } from './authSlice.js';
import { useCurrentUserQuery, useRefreshSessionMutation } from './authApi.js';

const AUTH_STORAGE_KEY = 'pipestock_auth';

export function AuthBootstrap() {
  const dispatch = useDispatch();
  const { token } = useSelector(selectAuth);
  const attemptedRefresh = useRef(false);
  const [refreshSession] = useRefreshSessionMutation();
  const currentUser = useCurrentUserQuery(undefined, { skip: !token });

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== AUTH_STORAGE_KEY) return;
      if (!event.newValue) {
        dispatch(clearSession());
        return;
      }

      try {
        const value = JSON.parse(event.newValue);
        if (value.token && value.user) {
          dispatch(setSession({ token: value.token, user: value.user }));
        } else {
          dispatch(clearSession());
        }
      } catch {
        dispatch(clearSession());
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [dispatch]);

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
