import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import {
  Brand,
  Icon,
  IconButton,
  SearchField,
  StatusChip,
} from '@shared/app/components/ui/PipeStockUI.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import { useGetProjectsQuery } from '../../features/projects/projectsApi.js';
import './ObjectsPage.css';

const STATUS_LABELS = {
  DRAFT: 'Draft',
  ACTIVE: 'Активний',
  PAUSED: 'Призупинений',
  COMPLETED: 'Завершений',
};

export function ObjectsPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [search, setSearch] = useState('');
  const { data: projects = [], isLoading, isError, refetch } = useGetProjectsQuery();
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const manager = membership?.role === 'MANAGER';

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(project =>
      [project.name, project.address, project.description]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query)),
    );
  }, [projects, search]);

  return (
    <div className="pageStack objectsPage">
      <header className="objectsHeader">
        <Brand compact />
        <div className="objectsHeader-account">
          <span>{manager ? 'Менеджер' : 'Працівник'}</span>
          <strong>{user?.name || 'PipeStock'}</strong>
        </div>
      </header>

      <section className="objectsHero">
        <div className="objectsTitleRow">
          <div className="compactHeader">
            <span className="sectionEyebrow">{membership?.company?.name || 'Компанія'}</span>
            <h1>Об’єкти</h1>
            <p>{manager ? 'Керуйте об’єктами та призначайте працівників.' : 'Тут показані об’єкти, на які вас призначив менеджер.'}</p>
          </div>
          {manager ? <IconButton icon="plus" label="Створити об’єкт" onClick={() => navigate('/objects/new')} /> : null}
        </div>
      </section>

      <SearchField value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук об’єктів..." aria-label="Пошук об’єктів" />

      {isLoading ? <section className="screenCard objectsState"><strong>Завантажуємо об’єкти…</strong></section> : null}
      {isError ? (
        <section className="screenCard objectsState">
          <strong>Не вдалося завантажити об’єкти</strong>
          <button type="button" className="objectsRetry" onClick={refetch}>Спробувати ще раз</button>
        </section>
      ) : null}

      {!isLoading && !isError && visibleProjects.length === 0 ? (
        <section className="screenCard objectsEmpty">
          <div className="objectsEmpty-icon"><Icon name="building" size={24} /></div>
          <strong>{search ? 'Нічого не знайдено' : 'Поки немає об’єктів'}</strong>
          <p>{search ? 'Спробуйте змінити пошуковий запит.' : manager ? 'Створіть перший об’єкт і призначте працівників.' : 'Об’єкти, призначені вам менеджером, з’являться тут.'}</p>
          {!search && manager ? (
            <button type="button" className="objectsCreateEmpty" onClick={() => navigate('/objects/new')}><Icon name="plus" size={18} /> Створити об’єкт</button>
          ) : null}
        </section>
      ) : null}

      {!isLoading && !isError && visibleProjects.length > 0 ? (
        <section className="objectsList" aria-label="Список об’єктів">
          {visibleProjects.map(project => (
            <Link className="objectCard" key={project.id} to={`/objects/${project.id}`}>
              <div className="objectCard-media">{project.imageUrl ? <img src={project.imageUrl} alt="" /> : <Icon name="building" size={25} />}</div>
              <div className="objectCard-copy">
                <div className="objectCard-titleRow"><strong>{project.name}</strong><StatusChip status={project.status}>{STATUS_LABELS[project.status] || project.status}</StatusChip></div>
                <span className="objectCard-address"><Icon name="mapPin" size={14} />{project.address || 'Адресу не вказано'}</span>
                {manager ? <span className="objectCard-meta"><Icon name="users" size={14} />{project.employees?.length || 0} {project.employees?.length === 1 ? 'працівник' : 'працівників'}</span> : null}
              </div>
              <Icon name="chevronRight" size={19} className="objectCard-chevron" />
            </Link>
          ))}
        </section>
      ) : null}

      <WorkspaceNavigation />
    </div>
  );
}
