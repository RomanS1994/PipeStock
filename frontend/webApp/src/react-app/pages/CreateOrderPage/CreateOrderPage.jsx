import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink, Button, TextField } from '@shared/app/components/ui/PipeStockUI.jsx';
import { useGetProjectQuery } from '../../features/projects/projectsApi.js';
import { useCreateOrderMutation } from '../../features/orders/ordersApi.js';
import '../OrderFlow/OrderFlow.css';

const CATEGORIES = ['Опалення', 'Водопостачання', 'Каналізація', 'Сантехніка', 'Інше'];

export function CreateOrderPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: project } = useGetProjectQuery(projectId);
  const [createOrder, { isLoading, error }] = useCreateOrderMutation();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Опалення');
  const [note, setNote] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const result = await createOrder({ projectId, title, category, note }).unwrap();
      navigate(`/orders/${result.order.id}`);
    } catch {
      // API error is rendered below.
    }
  }

  return (
    <div className="pageStack orderFlowPage">
      <header className="orderTopbar">
        <BackLink to={`/objects/${projectId}`} />
        <strong>Новий заказ</strong>
        <span />
      </header>

      <form className="screenCard orderCreateForm" onSubmit={handleSubmit}>
        <div className="compactHeader">
          <h1>Створення заказа</h1>
          <p>{project?.name || 'Об’єкт'}</p>
        </div>

        <TextField label="Назва заказа *" value={title} onChange={event => setTitle(event.target.value)} placeholder="Наприклад, Ванна кімната, 2 поверх" maxLength={120} />

        <label className="orderSelectField">
          <span>Категорія</span>
          <select value={category} onChange={event => setCategory(event.target.value)}>
            {CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>

        <label className="orderTextAreaField">
          <span>Примітка</span>
          <textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Що потрібно зробити на цьому заказі" maxLength={500} rows={5} />
          <small>{note.length}/500</small>
        </label>

        <div className="orderProjectSummary">
          <span>Об’єкт</span>
          <strong>{project?.name || 'Завантаження…'}</strong>
          <small>{project?.address || ''}</small>
        </div>

        {error ? <p className="orderError">{error?.data?.error || 'Не вдалося створити заказ'}</p> : null}
        <Button type="submit" fullWidth disabled={isLoading || !title.trim()}>{isLoading ? 'Створюємо…' : 'Створити заказ'}</Button>
      </form>
    </div>
  );
}
