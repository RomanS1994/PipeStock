import { NavLink } from 'react-router-dom';
import { Icon } from '@shared/app/components/ui/PipeStockUI.jsx';
import './WorkspaceNavigation.css';

const items = [
  { to: '/objects', label: 'Об’єкти', icon: 'building' },
  { to: '/orders', label: 'Закази', icon: 'clipboard' },
  { to: '/profile', label: 'Профіль', icon: 'user' },
];

export function WorkspaceNavigation() {
  return (
    <nav className="workspaceNavigation" aria-label="Основна навігація">
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
