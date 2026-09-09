import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAuth, markHydrated } from './authSlice.js';
import { useCurrentUserQuery, useRefreshSessionMutation } from './authApi.js';

export function AuthBootstrap() {
  const dispatch = useDispatch();
  const { token } = useSelector(selectAuth);
  const attemptedRefresh = useRef(false);
  const [refreshSession] = useRefreshSessionMutation();
  const currentUser = useCurrentUserQuery(undefined, { skip: !token });

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
