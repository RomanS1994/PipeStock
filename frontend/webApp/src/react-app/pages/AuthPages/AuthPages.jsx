import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell, Brand, Button, RoleCard, TextField } from '@shared/app/components/ui/PipeStockUI.jsx';
import {
  useJoinCompanyMutation,
  useLoginMutation,
  useRegisterEmployeeMutation,
  useRegisterManagerMutation,
} from '../../features/auth/authApi.js';
import './AuthPages.css';

function getApiError(error, fallback = 'Щось пішло не так. Спробуйте ще раз.') {
  return error?.data?.error || fallback;
}

function AuthHeading({ title, description }) {
  return (
    <header className="authHeading">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function WelcomePage() {
  const navigate = useNavigate();
  return (
    <div className="welcomePage">
      <div className="welcomePage-brand"><Brand /></div>
      <div className="welcomePage-copy">
        <span className="welcomePage-kicker">Матеріали під контролем</span>
        <h1>Швидкий облік матеріалів на об’єкті</h1>
        <p>Для сантехніків, монтажників і команд, які хочуть менше паперу та більше порядку.</p>
      </div>
      <div className="welcomePage-points">
        <span>✓ Облік на об’єкті</span>
        <span>✓ Зручні закази</span>
        <span>✓ Історія та PDF</span>
      </div>
      <Button fullWidth onClick={() => navigate('/sign-in')}>Розпочати</Button>
    </div>
  );
}

export function SignInPage() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const result = await login(form).unwrap();
      const hasCompany = (result.user?.memberships || []).some(item => item.status === 'ACTIVE' && item.company);
      navigate(hasCompany ? '/objects' : '/join-company', { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, 'Не вдалося увійти. Перевірте email і пароль.'));
    }
  }

  return (
    <AuthShell backTo="/">
      <AuthHeading title="Вхід до аккаунту" description="Увійдіть, щоб продовжити роботу з PipeStock." />
      <form className="authForm" onSubmit={submit}>
        <TextField icon="mail" type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={event => setForm(value => ({ ...value, email: event.target.value }))} />
        <TextField icon="lock" type="password" placeholder="Пароль" autoComplete="current-password" value={form.password} onChange={event => setForm(value => ({ ...value, password: event.target.value }))} />
        {error ? <p className="authError">{error}</p> : null}
        <Button type="submit" fullWidth disabled={isLoading}>{isLoading ? 'Входимо…' : 'Увійти'}</Button>
      </form>
      <div className="authDivider"><span>або</span></div>
      <p className="authSwitch">Немає аккаунту? <Link to="/role">Зареєструватися</Link></p>
    </AuthShell>
  );
}

export function RoleSelectionPage() {
  const navigate = useNavigate();
  return (
    <AuthShell backTo="/sign-in" step={{ current: 1, total: 4 }}>
      <AuthHeading title="Хто ви?" description="Виберіть свою роль у PipeStock, щоб отримати відповідні можливості." />
      <div className="roleGrid">
        <RoleCard icon="hardHat" title="Менеджер" description="Керую роботою з об’єктами, заказами та командою." onClick={() => navigate('/register/manager')} />
        <RoleCard icon="user" title="Працівник" description="Працюю на об’єктах, створюю закази та додаю матеріали." onClick={() => navigate('/register/employee')} />
      </div>
    </AuthShell>
  );
}

function RegistrationForm({ mode }) {
  const navigate = useNavigate();
  const manager = mode === 'manager';
  const [registerManager, managerState] = useRegisterManagerMutation();
  const [registerEmployee, employeeState] = useRegisterEmployeeMutation();
  const mutation = manager ? registerManager : registerEmployee;
  const isLoading = manager ? managerState.isLoading : employeeState.isLoading;
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '', phone: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await mutation({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        ...(manager ? { companyName: form.companyName } : {}),
      }).unwrap();
      navigate(manager ? '/objects' : '/join-company', { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }

  return (
    <AuthShell backTo="/role" step={{ current: 2, total: 4 }}>
      <AuthHeading
        title={manager ? 'Реєстрація менеджера' : 'Реєстрація працівника'}
        description={manager ? 'Створіть аккаунт, щоб керувати об’єктами та командою.' : 'Створіть аккаунт, щоб приєднатися до компанії.'}
      />
      <form className="authForm" onSubmit={submit}>
        <TextField icon="user" placeholder="Ім’я та прізвище" autoComplete="name" value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} required />
        <TextField icon="mail" type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={event => setForm(value => ({ ...value, email: event.target.value }))} required />
        <TextField icon="lock" type="password" placeholder="Пароль" autoComplete="new-password" value={form.password} onChange={event => setForm(value => ({ ...value, password: event.target.value }))} hint="Мінімум 8 символів" required />
        {manager ? <TextField icon="building" placeholder="Назва компанії" value={form.companyName} onChange={event => setForm(value => ({ ...value, companyName: event.target.value }))} required /> : null}
        <TextField icon="phone" type="tel" placeholder="Номер телефону" autoComplete="tel" value={form.phone} onChange={event => setForm(value => ({ ...value, phone: event.target.value }))} />
        {error ? <p className="authError">{error}</p> : null}
        <Button type="submit" fullWidth disabled={isLoading}>{isLoading ? 'Створюємо…' : 'Зареєструватися'}</Button>
      </form>
      <p className="authLegal">Реєструючись, ви погоджуєтесь з Умовами використання та Політикою конфіденційності.</p>
    </AuthShell>
  );
}

export function ManagerRegistrationPage() {
  return <RegistrationForm mode="manager" />;
}

export function EmployeeRegistrationPage() {
  return <RegistrationForm mode="employee" />;
}

export function JoinCompanyPage() {
  const navigate = useNavigate();
  const [joinCompany, { isLoading }] = useJoinCompanyMutation();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await joinCompany({ joinCode }).unwrap();
      navigate('/objects', { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, 'Компанію з таким кодом не знайдено.'));
    }
  }

  return (
    <AuthShell backTo="/role" step={{ current: 3, total: 4 }}>
      <AuthHeading title="Приєднання до компанії" description="Введіть код компанії, який надав ваш керівник." />
      <form className="authForm" onSubmit={submit}>
        <TextField icon="building" placeholder="PST-82KM4" value={joinCode} onChange={event => setJoinCode(event.target.value.toUpperCase())} maxLength={9} autoCapitalize="characters" required />
        <p className="authHint">Наприклад: PST-82KM4</p>
        {error ? <p className="authError">{error}</p> : null}
        <Button type="submit" fullWidth disabled={isLoading}>{isLoading ? 'Перевіряємо…' : 'Приєднатися'}</Button>
      </form>
    </AuthShell>
  );
}
