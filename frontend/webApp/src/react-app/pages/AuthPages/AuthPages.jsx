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

const ONBOARDING_SLIDES = [
  {
    kicker: 'Матеріали під контролем',
    title: 'Швидкий облік матеріалів на об’єкті',
    description: 'Виберіть систему, діаметр і потрібний елемент за кілька натискань — прямо під час монтажу.',
    image: '/materials/ppr-pipe.webp',
    secondaryImage: '/materials/ppr-coupling.webp',
    alt: 'PPR труба та фітинг',
  },
  {
    kicker: 'Заказ без зайвих записів',
    title: 'Збирайте матеріали в один заказ',
    description: 'Працівник створює заказ на об’єкті, швидко додає фітинги й кількість, а команда бачить актуальний список.',
    image: '/materials/pex-tee.webp',
    secondaryImage: '/materials/valve-ball.webp',
    alt: 'Сантехнічні фітинги для заказу',
  },
  {
    kicker: 'Вся історія в PipeStock',
    title: 'Переглядайте історію та готовий PDF',
    description: 'Збережені закази залишаються прив’язаними до об’єкта. Перевіряйте матеріали та відкривайте PDF без паперових списків.',
    image: '/materials/category-geberit.webp',
    secondaryImage: '/materials/ht-branch-45.webp',
    alt: 'Матеріали та обладнання для сантехнічного об’єкта',
  },
];

function getApiError(error, fallback = 'Щось пішло не так. Спробуйте ще раз.') {
  return error?.data?.error || fallback;
}

function getSignedInDestination(user) {
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE' && item.company);
  if (!membership) return '/join-company';
  return membership.role === 'MANAGER' ? '/dashboard' : '/objects';
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
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = ONBOARDING_SLIDES[slideIndex];
  const isLastSlide = slideIndex === ONBOARDING_SLIDES.length - 1;

  function finishOnboarding() {
    navigate('/sign-in');
  }

  function goNext() {
    if (isLastSlide) return finishOnboarding();
    setSlideIndex(value => Math.min(value + 1, ONBOARDING_SLIDES.length - 1));
  }

  return (
    <div className="welcomePage">
      <header className="welcomePage-topbar">
        <div className="welcomePage-brand"><Brand /></div>
        <button type="button" className="welcomePage-skip" onClick={finishOnboarding}>Пропустити</button>
      </header>

      <div className="welcomePage-hero" key={`hero-${slideIndex}`}>
        <span className="welcomePage-heroGlow" aria-hidden="true" />
        <div className="welcomePage-photo welcomePage-photoPrimary">
          <img src={slide.image} alt={slide.alt} />
        </div>
        <div className="welcomePage-photo welcomePage-photoSecondary" aria-hidden="true">
          <img src={slide.secondaryImage} alt="" />
        </div>
        <span className="welcomePage-heroBadge">{slideIndex + 1} / {ONBOARDING_SLIDES.length}</span>
      </div>

      <div className="welcomePage-copy" key={`copy-${slideIndex}`}>
        <span className="welcomePage-kicker">{slide.kicker}</span>
        <h1>{slide.title}</h1>
        <p>{slide.description}</p>
      </div>

      <footer className="welcomePage-footer">
        <div className="welcomePage-dots" aria-label="Екрани знайомства з PipeStock">
          {ONBOARDING_SLIDES.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={index === slideIndex ? 'is-active' : ''}
              aria-label={`Екран ${index + 1}`}
              aria-current={index === slideIndex ? 'step' : undefined}
              onClick={() => setSlideIndex(index)}
            />
          ))}
        </div>
        <Button fullWidth onClick={goNext}>{isLastSlide ? 'Розпочати' : 'Далі'}</Button>
      </footer>
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
      navigate(getSignedInDestination(result.user), { replace: true });
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
      <p className="authSwitch">Немає аккаунту? <Link to="/role">Зареєструватися</Link></p>
    </AuthShell>
  );
}

export function RoleSelectionPage() {
  const navigate = useNavigate();
  return (
    <AuthShell backTo="/sign-in">
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
      const result = await mutation({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        ...(manager ? { companyName: form.companyName } : {}),
      }).unwrap();
      navigate(manager ? '/dashboard' : getSignedInDestination(result.user), { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }

  return (
    <AuthShell backTo="/role">
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
    <AuthShell backTo="/role">
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
