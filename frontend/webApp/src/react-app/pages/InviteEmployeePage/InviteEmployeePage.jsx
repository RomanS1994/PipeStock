import { useState } from 'react';
import { BackLink, Button, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import {
  useGetTeamInviteQuery,
  useRegenerateTeamInviteMutation,
  useRevokeTeamInviteMutation,
} from '../../features/manager/managerApi.js';
import './InviteEmployeePage.css';

function formatInviteExpiry(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
}

export function InviteEmployeePage() {
  const { data: invite, isLoading } = useGetTeamInviteQuery();
  const [regenerateInvite, regenerateState] = useRegenerateTeamInviteMutation();
  const [revokeInvite, revokeState] = useRevokeTeamInviteMutation();
  const [copied, setCopied] = useState(false);

  async function copyText(text) {
    if (!text) return;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function shareInvite() {
    if (!invite?.code) return;
    const text = `Код для приєднання до PipeStock: ${invite.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PipeStock', text });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    await copyText(text);
  }

  return (
    <div className="pageStack inviteEmployeePage">
      <header className="inviteEmployeeTopbar">
        <BackLink to="/employees" />
        <strong>Запросити працівника</strong>
        <span />
      </header>

      <section className="screenCard inviteEmployeeCard">
        <div className="inviteEmployeeHeading">
          <div>
            <span className="sectionEyebrow">Код компанії</span>
            <h1>Запросіть працівника</h1>
            <p>Надішліть цей код працівнику. Він використає його під час приєднання до компанії.</p>
          </div>
          <StatusChip status={invite?.active ? 'active' : 'draft'}>{invite?.active ? 'Активний' : 'Недійсний'}</StatusChip>
        </div>

        {isLoading ? <p className="inviteEmployeeState">Завантажуємо код…</p> : (
          <>
            <div className="inviteCodeBox">
              <span>Код запрошення</span>
              <strong>{invite?.code || 'Код не створено'}</strong>
              {invite?.code ? <button type="button" onClick={() => copyText(invite.code)}>{copied ? 'Скопійовано' : 'Копіювати'}</button> : null}
            </div>

            <p className="inviteExpiry">Дійсний 7 днів · до {formatInviteExpiry(invite?.expiresAt)}</p>

            <div className="inviteEmployeeActions">
              {invite?.active ? <Button fullWidth onClick={shareInvite}>Поділитися кодом</Button> : null}
              <Button variant={invite?.active ? 'secondary' : 'primary'} fullWidth disabled={regenerateState.isLoading} onClick={() => regenerateInvite()}>
                {regenerateState.isLoading ? 'Створюємо…' : invite?.active ? 'Створити новий код' : 'Створити код'}
              </Button>
              {invite?.active ? <Button variant="text" fullWidth disabled={revokeState.isLoading} onClick={() => revokeInvite()}>{revokeState.isLoading ? 'Відкликаємо…' : 'Відкликати код'}</Button> : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
