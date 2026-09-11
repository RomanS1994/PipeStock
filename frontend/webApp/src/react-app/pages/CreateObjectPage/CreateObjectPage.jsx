import { useNavigate } from 'react-router-dom';

import { BackLink } from '@shared/app/components/ui/PipeStockUI.jsx';
import { ProjectForm } from '../../features/projects/ProjectForm.jsx';
import {
  useCreateProjectMutation,
  useGetEmployeesQuery,
} from '../../features/projects/projectsApi.js';
import './CreateObjectPage.css';

function getApiError(error) {
  return error?.data?.error || 'Не вдалося створити об’єкт';
}

export function CreateObjectPage() {
  const navigate = useNavigate();
  const { data: employees = [], isLoading: employeesLoading } = useGetEmployeesQuery();
  const [createProject, { isLoading, error }] = useCreateProjectMutation();

  async function handleSubmit(values) {
    try {
      const result = await createProject(values).unwrap();
      navigate(`/objects/${result.project.id}`, { replace: true });
    } catch {
      // RTK Query exposes the error state below the form.
    }
  }

  return (
    <div className="pageStack createObjectPage">
      <header className="createObjectHeader">
        <BackLink to="/objects" />
        <div>
          <h1>Створити об’єкт</h1>
          <p>Додайте основну інформацію та працівників.</p>
        </div>
        <span />
      </header>

      <section className="screenCard createObjectCard">
        <ProjectForm
          employees={employees}
          employeesLoading={employeesLoading}
          submitting={isLoading}
          submitLabel="Створити об’єкт"
          error={error ? getApiError(error) : ''}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
