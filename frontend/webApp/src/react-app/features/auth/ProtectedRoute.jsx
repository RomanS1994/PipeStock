import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from './authSlice.js';

export function ProtectedRoute({ children, requireCompany = true }) {
  const location = useLocation();
  const { token, user, hydrated } = useSelector(selectAuth);

  if (!hydrated) {
    return <div className="screenCard">Завантаження…</div>;
  }

  if (!token || !user) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  const hasCompany = (user.memberships || []).some(item => item.status === 'ACTIVE' && item.company);
  if (requireCompany && !hasCompany) {
    return <Navigate to="/join-company" replace />;
  }

  return children;
}
