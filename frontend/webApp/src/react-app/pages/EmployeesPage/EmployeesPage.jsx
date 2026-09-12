import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchField, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import {
  useGetTeamQuery,
  useUpdateTeamMemberMutation,
} from '../../features/manager/managerApi.js';
import './EmployeesPage.css';

export function EmployeesPage() {
  const { data: members = [], isLoading, isError, refetch } = useGetTeamQuery();
  const [updateMember, { isLoading: updating }] = useUpdateTeamMemberMutation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [statusError, setStatusError] = useState('');

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter(member => {
      if (filter !== 'ALL' && member.status !== filter) return false;
      if (!query) return true;
      return [member.user?.name, member.user?.email, member.user?.phone]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query));
    });
  }, [members, search, filter]);

  async function toggleStatus(member) {
    setStatusError('');
    try {
      await updateMember({
        membershipId: member.membershipId,
        status: member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      }).unwrap();
    } catch (error) {
      setStatusError(error?.data?.error || 'Не вдалося змінити статус працівника.');
    }
  }

  return (
    <div className="pageStack employeesPage">
      <header className="employeesHeader">
        <div className="compactHeader">
          <span className="sectionEyebrow">Команда</span>
          <h1>Працівники</h1>
          <p>Керуйте доступом працівників і переглядайте їх активність.</p>
        </div>
        <Link className="psButton psButton--primary employeesInviteButton" to="/employees/invite">+ Запросити</Link>
      </header>

      <SearchField value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук працівника…" />

      <div className="employeesFilters">
        {[['ALL','Усі'],['ACTIVE','Активні'],['INACTIVE','Неактивні']].map(([value,label]) => (
          <button key={value} type="button" className={filter===value?'is-active':''} onClick={() => setFilter(value)}>{label}</button>
        ))}
      </div>

      {statusError ? <p className="employeesStatusError" role="alert">{statusError}</p> : null}
      {isLoading ? <section className="screenCard">Завантажуємо працівників…</section> : null}
      {isError ? <section className="screenCard employeesState"><strong>Не вдалося завантажити команду</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section> : null}

      {!isLoading && !isError && visibleMembers.length ? (
        <section className="employeesList">
          {visibleMembers.map(member => (
            <article key={member.membershipId} className="employeeCard">
              <div className="employeeCardAvatar">{(member.user?.name || member.user?.email || '?').slice(0,1).toUpperCase()}</div>
              <div className="employeeCardCopy">
                <div className="employeeCardTitle"><strong>{member.user?.name || member.user?.email}</strong><StatusChip status={member.status === 'ACTIVE' ? 'active' : 'draft'}>{member.status === 'ACTIVE' ? 'Активний' : 'Неактивний'}</StatusChip></div>
                <span>{member.user?.email}</span>
                {member.user?.phone ? <span>{member.user.phone}</span> : null}
                <small>{member.projectCount} об’єктів · {member.orderCount} заказів</small>
              </div>
              <button type="button" disabled={updating} className="employeeCardAction" onClick={() => toggleStatus(member)}>{member.status === 'ACTIVE' ? 'Вимкнути' : 'Активувати'}</button>
            </article>
          ))}
        </section>
      ) : null}

      {!isLoading && !isError && !visibleMembers.length ? <section className="screenCard employeesState"><strong>Працівників не знайдено</strong><p>Спробуйте змінити пошук або фільтр.</p></section> : null}

      <WorkspaceNavigation />
    </div>
  );
}
