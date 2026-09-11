import { useEffect, useState } from 'react';

import { Button, Icon, TextField } from '@shared/app/components/ui/PipeStockUI.jsx';
import { ImageUploadField } from '../../components/ImageUploadField/ImageUploadField.jsx';
import './ProjectForm.css';

const DEFAULT_VALUES = {
  name: '',
  address: '',
  description: '',
  imageUrl: '',
  status: 'ACTIVE',
  employeeMembershipIds: [],
};

export function ProjectForm({
  initialValues = DEFAULT_VALUES,
  employees = [],
  employeesLoading = false,
  submitting = false,
  submitLabel = 'Зберегти',
  error = '',
  onUploadImage,
  onSubmit,
}) {
  const [values, setValues] = useState(DEFAULT_VALUES);

  useEffect(() => {
    setValues({
      ...DEFAULT_VALUES,
      ...initialValues,
      employeeMembershipIds: [...(initialValues.employeeMembershipIds || [])],
    });
  }, [initialValues]);

  function updateField(field, value) {
    setValues(current => ({ ...current, [field]: value }));
  }

  function toggleEmployee(membershipId) {
    setValues(current => ({
      ...current,
      employeeMembershipIds: current.employeeMembershipIds.includes(membershipId)
        ? current.employeeMembershipIds.filter(id => id !== membershipId)
        : [...current.employeeMembershipIds, membershipId],
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.({
      name: values.name.trim(),
      address: values.address.trim(),
      description: values.description.trim(),
      imageUrl: values.imageUrl.trim(),
      status: values.status,
      employeeMembershipIds: values.employeeMembershipIds,
    });
  }

  return (
    <form className="projectForm" onSubmit={handleSubmit}>
      <ImageUploadField
        value={values.imageUrl}
        label="Фото об’єкта"
        disabled={submitting}
        onUpload={onUploadImage}
        onChange={value => updateField('imageUrl', value)}
      />

      <TextField
        label="Назва об’єкта *"
        value={values.name}
        onChange={event => updateField('name', event.target.value)}
        placeholder="Наприклад, Villa Green Hill"
        maxLength={120}
        required
      />

      <TextField
        label="Адреса"
        icon="mapPin"
        value={values.address}
        onChange={event => updateField('address', event.target.value)}
        placeholder="Введіть адресу"
        maxLength={240}
      />

      <label className="projectForm-field">
        <span>Примітка</span>
        <textarea
          value={values.description}
          onChange={event => updateField('description', event.target.value)}
          placeholder="Додаткова інформація про об’єкт"
          rows={4}
          maxLength={1000}
        />
      </label>

      <label className="projectForm-field">
        <span>Статус</span>
        <select value={values.status} onChange={event => updateField('status', event.target.value)}>
          <option value="ACTIVE">Активний</option>
          <option value="DRAFT">Draft</option>
          <option value="PAUSED">Призупинений</option>
          <option value="COMPLETED">Завершений</option>
        </select>
      </label>

      <section className="projectForm-employees">
        <div className="projectForm-sectionTitle">
          <span className="projectForm-sectionIcon"><Icon name="users" size={18} /></span>
          <div>
            <strong>Призначити працівників</strong>
            <span>Вони бачитимуть цей об’єкт у своєму аккаунті.</span>
          </div>
        </div>

        {employeesLoading ? <p className="projectForm-note">Завантажуємо працівників…</p> : null}
        {!employeesLoading && employees.length === 0 ? (
          <p className="projectForm-note">У компанії ще немає активних працівників.</p>
        ) : null}

        {employees.length > 0 ? (
          <div className="projectForm-employeeList">
            {employees.map(employee => {
              const checked = values.employeeMembershipIds.includes(employee.membershipId);
              return (
                <label className={`projectForm-employee${checked ? ' is-selected' : ''}`} key={employee.membershipId}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEmployee(employee.membershipId)}
                  />
                  <span className="projectForm-avatar">{(employee.user?.name || '?').slice(0, 1).toUpperCase()}</span>
                  <span className="projectForm-employeeCopy">
                    <strong>{employee.user?.name || employee.user?.email}</strong>
                    <small>{employee.user?.email}</small>
                  </span>
                  <span className="projectForm-check"><Icon name="check" size={16} /></span>
                </label>
              );
            })}
          </div>
        ) : null}
      </section>

      {error ? <p className="projectForm-error" role="alert">{error}</p> : null}

      <Button type="submit" fullWidth disabled={submitting || !values.name.trim()}>
        {submitting ? 'Зберігаємо…' : submitLabel}
      </Button>
    </form>
  );
}
