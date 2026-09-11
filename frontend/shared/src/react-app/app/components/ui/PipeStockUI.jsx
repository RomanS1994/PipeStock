import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import './PipeStockUI.css';

const iconPaths = {
  arrowLeft: 'M15 18l-6-6 6-6',
  building: 'M3 21h18M5 21V7l7-4v18M19 21V11l-7-4M9 9h.01M9 13h.01M9 17h.01M15 13h.01M15 17h.01',
  check: 'M20 6 9 17l-5-5',
  chevronRight: 'M9 18l6-6-6-6',
  clipboard: 'M9 5h6M9 3h6v4H9zM7 5H5v16h14V5h-2M8 11h8M8 15h8',
  clock: 'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A11 11 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.1 3.1M6.2 6.2C3.4 8.1 2 12 2 12s3.5 8 10 8a10 10 0 0 0 4.1-.9',
  hardHat: 'M2 18h20M5 18v-2a7 7 0 0 1 14 0v2M9 9V5h6v4M12 5V2',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  home: 'M3 11.5 12 4l9 7.5M5 10v10h14V10M9 20v-6h6v6',
  lock: 'M6 10V8a6 6 0 0 1 12 0v2M5 10h14v11H5z',
  mail: 'M4 5h16v14H4zM4 7l8 6 8-6',
  mapPin: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  phone: 'M5 3l4 2-2 4a16 16 0 0 0 8 8l4-2 2 4-2 2C10 21 3 14 3 5z',
  plus: 'M12 5v14M5 12h14',
  search: 'M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.8 6.4 20.6 7.5 14 3 9.6l6.2-.9L12 3Z',
  user: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
};

export function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  const path = iconPaths[name];
  if (!path) return null;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export function Brand({ compact = false }) {
  return (
    <div className={`pipeBrand${compact ? ' pipeBrand--compact' : ''}`} aria-label="PipeStock">
      <span className="pipeBrand-mark" aria-hidden="true"><span /><span /><span /></span>
      <span className="pipeBrand-name"><strong>Pipe</strong><b>Stock</b></span>
    </div>
  );
}

export function Button({ variant = 'primary', fullWidth = false, className = '', type = 'button', ...props }) {
  return <button type={type} className={`psButton psButton--${variant}${fullWidth ? ' psButton--full' : ''} ${className}`.trim()} {...props} />;
}

export function IconButton({ icon, label, className = '', ...props }) {
  return (
    <button type="button" className={`psIconButton ${className}`.trim()} aria-label={label} {...props}>
      <Icon name={icon} size={20} />
    </button>
  );
}

export function TextField({ label, icon, type = 'text', error, hint, className = '', ...props }) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <label className={`psField ${error ? 'psField--error' : ''} ${className}`.trim()} htmlFor={id}>
      {label ? <span className="psField-label">{label}</span> : null}
      <span className="psField-control">
        {icon ? <Icon name={icon} size={18} className="psField-icon" /> : null}
        <input id={id} type={inputType} {...props} />
        {isPassword ? (
          <button className="psField-eye" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}>
            <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
          </button>
        ) : null}
      </span>
      {error ? <span className="psField-error">{error}</span> : hint ? <span className="psField-hint">{hint}</span> : null}
    </label>
  );
}

export function SearchField({ className = '', ...props }) {
  return (
    <label className={`psSearch ${className}`.trim()}>
      <Icon name="search" size={18} />
      <input type="search" {...props} />
    </label>
  );
}

export function StatusChip({ status, children }) {
  const normalized = String(status || '').toLowerCase();
  return <span className={`psStatusChip psStatusChip--${normalized}`}>{children}</span>;
}

export function StepIndicator({ current = 1, total = 4 }) {
  return (
    <div className="psSteps" aria-label={`Крок ${current} з ${total}`}>
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        return <span key={step} className={`psSteps-dot${step <= current ? ' is-active' : ''}`} />;
      })}
    </div>
  );
}

export function BackLink({ to, label = 'Назад' }) {
  return (
    <Link className="psBackLink" to={to} aria-label={label}>
      <Icon name="arrowLeft" size={22} />
    </Link>
  );
}

export function RoleCard({ icon, title, description, onClick }) {
  return (
    <button type="button" className="psRoleCard" onClick={onClick}>
      <span className="psRoleCard-icon"><Icon name={icon} size={30} /></span>
      <span className="psRoleCard-copy"><strong>{title}</strong><span>{description}</span></span>
      <Icon name="chevronRight" size={20} className="psRoleCard-chevron" />
    </button>
  );
}

export function AuthShell({ backTo, step, children, footer }) {
  return (
    <div className="authShell">
      <div className="authShell-topbar">
        {backTo ? <BackLink to={backTo} /> : <span />}
        {step ? <StepIndicator current={step.current} total={step.total} /> : <span />}
        <span />
      </div>
      <Brand compact />
      <div className="authShell-content">{children}</div>
      {footer ? <div className="authShell-footer">{footer}</div> : null}
    </div>
  );
}
