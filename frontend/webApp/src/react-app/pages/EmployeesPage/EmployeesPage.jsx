import { useMemo, useState } from 'react';
import { Button, SearchField, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import {
  useGetTeamInviteQuery,
  useGetTeamQuery,
  useRegenerateTeamInviteMutation,
  useRevokeTeamInviteMutation,
  useUpdateTeamMemberMutation,
} from '../../features/manager/managerApi.js';
import './EmployeesPage.css';

function formatInviteExpiry(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
}

export function EmployeesPage() {
  const { data: members = [], isLoading, isError, refetch } = useGetTeamQuery();
  const { data: invite, isLoading: inviteLoading } = useGetTeamInviteQuery();
  const [regenerateInvite, regenerateState] = useRegenerateTeamInviteMutation();
  const [revokeInvite, revokeState] = useRevokeTeamInviteMutation();
  const [updateMember, { isLoading: updating }] = useUpdateTeamMemberMutation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [copied, setCopied] = useState(false);

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
    await updateMember({
      membershipId: member.membershipId,
      status: member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
  }

  async function copyInvite() {
    if (!invite?.code) return;
    await navigator.clipboard?.writeText(invite.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function shareInvite() {
    if (!invite?.code) return;
    const text = `Код для приєднання до PipeStock: ${invite.code}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'PipeStock', text }); } catch { /* user cancelled */ }
      return;
    }
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="pageStack employeesPage">
      <header className="compactHeader">
        <span className="sectionEyebrow">Команда</span>
        <h1>Працівники</h1>
        <p>Керуйте доступом працівників і переглядайте їх активність.</p>
      </header>

      <section className="screenCard employeeInviteCard">
        <div className="employeeInviteHeading">
          <div>
            <strong>Запросити працівника</strong>
            <span>Код діє 7 днів. Новий код автоматично робить попередній недійсним.</span>
          </div>
          <StatusChip status={invite?.active ? 'active' : 'draft'}>{invite?.active ? 'Активний' : 'Недійсний'}</StatusChip>
        </div>

        {inviteLoading ? <p className="employeeInviteState">Завантажуємо код…</p> : (
          <>
            <div className="employeeInviteCodeRow">
              <strong>{invite?.code || 'Код не створено'}</strong>
              {invite?.code ? <button type="button" onClick={copyInvite}>{copied ? 'Скопійовано' : 'Копіювати'}</button> : null}
            </div>
            <small>Дійсний до: {formatInviteExpiry(invite?.expiresAt)}</small>
            <div className="employeeInviteActions">
              <Button variant="secondary" disabled={regenerateState.isLoading} onClick={() => regenerateInvite()}>
                {regenerateState.isLoading ? 'Створюємо…' : invite?.active ? 'Новий код' : 'Створити код'}
              </Button>
              {invite?.active ? <Button variant="text" onClick={shareInvite}>Поділитися</Button> : null}
              {invite?.active ? <Button variant="text" disabled={revokeState.isLoading} onClick={() => revokeInvite()}>{revokeState.isLoading ? 'Відкликаємо…' : 'Відкликати'}</Button> : null}
            </div>
          </>
        )}
      </section>

      <SearchField value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук працівника…" />

      <div className="employeesFilters">
        {[['ALL','Усі'],['ACTIVE','Активні'],['INACTIVE','Неактивні']].map(([value,label]) => (
          <button key={value} type="button" className={filter===value?'is-active':''} onClick={() => setFilter(value)}>{label}</button>
        ))}
      </div>

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
