import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Icon } from '@shared/app/components/ui/PipeStockUI.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import './WorkspaceNavigation.css';

const managerItems = [
  { to: '/dashboard', label: 'Головна', icon: 'home' },
  { to: '/objects', label: 'Об’єкти', icon: 'building' },
  { to: '/orders', label: 'Закази', icon: 'clipboard' },
  { to: '/employees', label: 'Працівники', icon: 'users' },
  { to: '/profile', label: 'Ще', icon: 'user' },
];

const employeeItems = [
  { to: '/objects', label: 'Об’єкти', icon: 'building' },
  { to: '/orders', label: 'Закази', icon: 'clipboard' },
  { to: '/history', label: 'Історія', icon: 'history' },
  { to: '/profile', label: 'Профіль', icon: 'user' },
];

export function WorkspaceNavigation() {
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const items = membership?.role === 'MANAGER' ? managerItems : employeeItems;

  return (
    <nav className="workspaceNavigation" aria-label="Основна навігація" style={{ '--nav-items': items.length }}>
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `workspaceNavigation-item${isActive ? ' is-active' : ''}`}
        >
          <Icon name={item.icon} size={21} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
