import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

import { BackLink, Button, Icon, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import { useGetProjectOrdersQuery } from '../../features/orders/ordersApi.js';
import { ProjectForm } from '../../features/projects/ProjectForm.jsx';
import { useGetEmployeesQuery, useGetProjectQuery, useUpdateProjectMutation } from '../../features/projects/projectsApi.js';
import { uploadImageFile, usePrepareImageUploadMutation } from '../../features/uploads/uploadsApi.js';
import './ObjectDetailPage.css';

const STATUS_LABELS = { DRAFT: 'Draft', ACTIVE: 'Активний', PAUSED: 'Призупинений', COMPLETED: 'Завершений' };
const ORDER_STATUS_LABELS = { DRAFT: 'Draft', SUBMITTED: 'Submitted', COMPLETED: 'Completed' };

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
  const { data: orders = [], isLoading: ordersLoading } = useGetProjectOrdersQuery(projectId);
  const { data: employees = [], isLoading: employeesLoading } = useGetEmployeesQuery(undefined, { skip: !manager });
  const [updateProject, { isLoading: saving, error: saveError }] = useUpdateProjectMutation();
  const [prepareImageUpload] = usePrepareImageUploadMutation();

  const initialValues = useMemo(() => ({
    name: project?.name || '',
    address: project?.address || '',
    description: project?.description || '',
    imageUrl: project?.imageUrl || '',
    status: project?.status || 'ACTIVE',
    employeeMembershipIds: (project?.employees || []).map(employee => employee.membershipId),
  }), [project]);

  async function handleUploadImage(file) {
    const upload = await prepareImageUpload('project').unwrap();
    return uploadImageFile(file, upload);
  }

  async function handleSave(values) {
    try {
      await updateProject({ projectId, ...values }).unwrap();
      setEditing(false);
    } catch {
      // mutation error rendered below
    }
  }

  if (isLoading) return <section className="screenCard objectDetailState"><strong>Завантажуємо об’єкт…</strong></section>;
  if (isError || !project) return <section className="screenCard objectDetailState"><strong>Не вдалося відкрити об’єкт</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section>;

  return (
    <div className="pageStack objectDetailPage">
      <header className="objectDetailTopbar"><BackLink to="/objects" /><strong>Об’єкт</strong><span /></header>
      <section className="objectDetailHero">
        <div className="objectDetailMedia">{project.imageUrl ? <img src={project.imageUrl} alt="" /> : <Icon name="building" size={44} />}</div>
        <div className="objectDetailHeading"><div><h1>{project.name}</h1><span><Icon name="mapPin" size={15} /> {project.address || 'Адресу не вказано'}</span></div><StatusChip status={project.status}>{STATUS_LABELS[project.status] || project.status}</StatusChip></div>
      </section>

      {editing ? (
        <section className="screenCard objectDetailEditCard">
          <div className="objectDetailSectionHeader"><div><strong>Редагування</strong><span>Змініть інформацію, фото та склад команди.</span></div><Button variant="text" onClick={() => setEditing(false)}>Скасувати</Button></div>
          <ProjectForm initialValues={initialValues} employees={employees} employeesLoading={employeesLoading} submitting={saving} submitLabel="Зберегти зміни" error={saveError ? getApiError(saveError) : ''} onUploadImage={handleUploadImage} onSubmit={handleSave} />
        </section>
      ) : (
        <>
          <section className="screenCard objectDetailOrders">
            <div className="objectDetailSectionHeader"><div><strong>Закази</strong><span>{orders.length} на цьому об’єкті.</span></div>{project.status !== 'COMPLETED' ? <Link className="objectDetailActionLink" to={`/objects/${project.id}/orders/new`}>+ Новий заказ</Link> : null}</div>
            {ordersLoading ? <p className="objectDetailEmptyTeam">Завантажуємо закази…</p> : orders.length ? (
              <div className="objectOrderList">{orders.map(order => <Link className="objectOrderRow" key={order.id} to={`/orders/${order.id}`}><div><strong>#{order.number} · {order.title}</strong><span>{order.category || 'Без категорії'} · {order.worker?.name || '—'}</span></div><div><StatusChip status={order.status}>{ORDER_STATUS_LABELS[order.status]}</StatusChip><small>{order.itemCount} поз.</small></div></Link>)}</div>
            ) : <div className="objectDetailEmptyOrders"><strong>Заказів ще немає</strong><span>Створіть перший заказ і додайте потрібні матеріали.</span></div>}
            {project.status !== 'COMPLETED' ? <Link className="psButton psButton--primary psButton--full objectDetailButtonLink" to={`/objects/${project.id}/orders/new`}>+ Новий заказ</Link> : null}
          </section>

          <section className="screenCard objectDetailInfo">
            <div className="objectDetailSectionHeader"><div><strong>Інформація</strong><span>Основні дані об’єкта.</span></div>{manager ? <Button variant="text" onClick={() => setEditing(true)}>Редагувати</Button> : null}</div>
            <dl><div><dt>Адреса</dt><dd>{project.address || '—'}</dd></div><div><dt>Примітка</dt><dd>{project.description || '—'}</dd></div><div><dt>Статус</dt><dd>{STATUS_LABELS[project.status] || project.status}</dd></div></dl>
          </section>

          <section className="screenCard objectDetailTeam">
            <div className="objectDetailSectionHeader"><div><strong>Працівники</strong><span>{project.employees?.length || 0} призначено на об’єкт.</span></div></div>
            {project.employees?.length ? <div className="objectDetailEmployeeList">{project.employees.map(employee => <div className="objectDetailEmployee" key={employee.membershipId}><span className="objectDetailAvatar">{(employee.user?.name || '?').slice(0,1).toUpperCase()}</span><div><strong>{employee.user?.name || employee.user?.email}</strong><span>{employee.user?.email}</span></div></div>)}</div> : <p className="objectDetailEmptyTeam">Працівників ще не призначено.</p>}
          </section>
        </>
      )}
    </div>
  );
}
