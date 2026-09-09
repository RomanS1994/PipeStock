import { useSelector } from 'react-redux';
import { Brand, Button } from '@shared/app/components/ui/PipeStockUI.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import { useLogoutMutation } from '../../features/auth/authApi.js';
import './ObjectsPage.css';

export function ObjectsPage() {
  const user = useSelector(selectUser);
  const [logout] = useLogoutMutation();
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const manager = membership?.role === 'MANAGER';

  return (
    <div className="pageStack objectsPage">
      <header className="objectsHeader">
        <Brand compact />
        <div>
          <span>{manager ? 'Менеджер' : 'Працівник'}</span>
          <strong>{user?.name || 'PipeStock'}</strong>
        </div>
      </header>

      <section className="objectsHero">
        <div className="compactHeader">
          <span className="sectionEyebrow">{membership?.company?.name || 'Компанія'}</span>
          <h1>Об’єкти</h1>
          <p>Auth foundation готовий. Наступним етапом тут з’явиться реальний список об’єктів із Prisma.</p>
        </div>
        {manager && membership?.company?.joinCode ? (
          <div className="companyCodeCard">
            <span>Код для працівників</span>
            <strong>{membership.company.joinCode}</strong>
          </div>
        ) : null}
      </section>

      <section className="screenCard objectsEmpty">
        <div className="objectsEmpty-icon">+</div>
        <strong>Поки немає об’єктів</strong>
        <p>{manager ? 'На наступному етапі менеджер зможе створити перший об’єкт.' : 'Об’єкти, призначені вам менеджером, з’являться тут.'}</p>
      </section>

      <Button variant="text" onClick={() => logout()}>Вийти з аккаунту</Button>
    </div>
  );
}
