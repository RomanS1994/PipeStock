import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import {
  BackLink,
  Button,
  Icon,
  StatusChip,
} from '@shared/app/components/ui/PipeStockUI.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import { ProjectForm } from '../../features/projects/ProjectForm.jsx';
import {
  useGetEmployeesQuery,
  useGetProjectQuery,
  useUpdateProjectMutation,
} from '../../features/projects/projectsApi.js';
import './ObjectDetailPage.css';

const STATUS_LABELS = {
  DRAFT: 'Draft',
  ACTIVE: 'Активний',
  PAUSED: 'Призупинений',
  COMPLETED: 'Завершений',
};

function getApiError(error) {
  return error?.data?.error || 'Не вдалося зберегти зміни';
}

export function ObjectDetailPage() {
  const { projectId } = useParams();
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const manager = membership?.role === 'MANAGER';
  const [editing, setEditing] = useState(false);

  const { data: project, isLoading, isError, refetch } = useGetProjectQuery(projectId);
  const { data: employees = [], isLoading: employeesLoading } = useGetEmployeesQuery(undefined, { skip: !manager });
  const [updateProject, { isLoading: saving, error: saveError }] = useUpdateProjectMutation();

  const initialValues = useMemo(() => ({
    name: project?.name || '',
    address: project?.address || '',
    description: project?.description || '',
    status: project?.status || 'ACTIVE',
    employeeMembershipIds: (project?.employees || []).map(employee => employee.membershipId),
  }), [project]);

  async function handleSave(values) {
    try {
      await updateProject({ projectId, ...values }).unwrap();
      setEditing(false);
    } catch {
      // Mutation error is rendered by the form.
    }
  }

  if (isLoading) {
    return <section className="screenCard objectDetailState"><strong>Завантажуємо об’єкт…</strong></section>;
  }

  if (isError || !project) {
    return (
      <section className="screenCard objectDetailState">
        <strong>Не вдалося відкрити об’єкт</strong>
        <button type="button" onClick={refetch}>Спробувати ще раз</button>
      </section>
    );
  }

  return (
    <div className="pageStack objectDetailPage">
      <header className="objectDetailTopbar">
        <BackLink to="/objects" />
        <strong>Об’єкт</strong>
        <span />
      </header>

      <section className="objectDetailHero">
        <div className="objectDetailMedia">
          {project.imageUrl ? <img src={project.imageUrl} alt="" /> : <Icon name="building" size={44} />}
        </div>
        <div className="objectDetailHeading">
          <div>
            <h1>{project.name}</h1>
            <span><Icon name="mapPin" size={15} /> {project.address || 'Адресу не вказано'}</span>
          </div>
          <StatusChip status={project.status}>{STATUS_LABELS[project.status] || project.status}</StatusChip>
        </div>
      </section>

      {editing ? (
        <section className="screenCard objectDetailEditCard">
          <div className="objectDetailSectionHeader">
            <div><strong>Редагування</strong><span>Змініть інформацію та склад команди.</span></div>
            <Button variant="text" onClick={() => setEditing(false)}>Скасувати</Button>
          </div>
          <ProjectForm
            initialValues={initialValues}
            employees={employees}
            employeesLoading={employeesLoading}
            submitting={saving}
            submitLabel="Зберегти зміни"
            error={saveError ? getApiError(saveError) : ''}
            onSubmit={handleSave}
          />
        </section>
      ) : (
        <>
          <section className="screenCard objectDetailInfo">
            <div className="objectDetailSectionHeader">
              <div><strong>Інформація</strong><span>Основні дані об’єкта.</span></div>
              {manager ? <Button variant="text" onClick={() => setEditing(true)}>Редагувати</Button> : null}
            </div>
            <dl>
              <div><dt>Адреса</dt><dd>{project.address || '—'}</dd></div>
              <div><dt>Примітка</dt><dd>{project.description || '—'}</dd></div>
              <div><dt>Статус</dt><dd>{STATUS_LABELS[project.status] || project.status}</dd></div>
            </dl>
          </section>

          <section className="screenCard objectDetailTeam">
            <div className="objectDetailSectionHeader">
              <div><strong>Працівники</strong><span>{project.employees?.length || 0} призначено на об’єкт.</span></div>
            </div>
            {project.employees?.length ? (
              <div className="objectDetailEmployeeList">
                {project.employees.map(employee => (
                  <div className="objectDetailEmployee" key={employee.membershipId}>
                    <span className="objectDetailAvatar">{(employee.user?.name || '?').slice(0, 1).toUpperCase()}</span>
                    <div><strong>{employee.user?.name || employee.user?.email}</strong><span>{employee.user?.email}</span></div>
                  </div>
                ))}
              </div>
            ) : <p className="objectDetailEmptyTeam">Працівників ще не призначено.</p>}
          </section>
        </>
      )}
    </div>
  );
}
