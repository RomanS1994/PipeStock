import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button } from '@shared/app/components/ui/PipeStockUI.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import { useLogoutMutation } from '../../features/auth/authApi.js';
import './ProfilePage.css';

export function ProfilePage() {
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const manager = membership?.role === 'MANAGER';
  const [logout, { isLoading }] = useLogoutMutation();

  return (
    <div className="pageStack profilePage">
      <header className="compactHeader">
        <h1>Профіль</h1>
        <p>Ваш аккаунт і поточна компанія.</p>
      </header>

      <section className="screenCard profileCard">
        <span className="profileAvatar">{(user?.name || '?').slice(0, 1).toUpperCase()}</span>
        <div><strong>{user?.name || 'Користувач'}</strong><span>{user?.email}</span></div>
      </section>

      <section className="screenCard profileDetails">
        <dl>
          <div><dt>Роль</dt><dd>{manager ? 'Менеджер' : 'Працівник'}</dd></div>
          <div><dt>Компанія</dt><dd>{membership?.company?.name || '—'}</dd></div>
          <div><dt>Телефон</dt><dd>{user?.phone || '—'}</dd></div>
        </dl>
      </section>

      {manager ? <Link className="psButton psButton--secondary psButton--full" to="/materials">Каталог матеріалів</Link> : null}
      <Button variant="text" disabled={isLoading} onClick={() => logout()}>{isLoading ? 'Виходимо…' : 'Вийти з аккаунту'}</Button>
      <WorkspaceNavigation />
    </div>
  );
}
