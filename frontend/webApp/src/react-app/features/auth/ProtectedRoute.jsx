import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from './authSlice.js';

export function ProtectedRoute({ children, requireCompany = true, requireManager = false }) {
  const location = useLocation();
  const { token, user, hydrated } = useSelector(selectAuth);

  if (!hydrated) {
    return <div className="screenCard">Завантаження…</div>;
  }

  if (!token || !user) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  const activeMembership = (user.memberships || []).find(
    item => item.status === 'ACTIVE' && item.company,
  );

  if (requireCompany && !activeMembership) {
    return <Navigate to="/join-company" replace />;
  }

  if (requireManager && activeMembership?.role !== 'MANAGER') {
    return <Navigate to="/objects" replace />;
  }

  return children;
}
