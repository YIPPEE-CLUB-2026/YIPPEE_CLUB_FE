import { useState } from 'react';
import { Icon } from './Icon';

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  autoComplete = 'new-password',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="wire-field">
      <span>{label}</span>
      <span className="wire-field__password">
        <input
          aria-label={label}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={128}
          required
          disabled={disabled}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="icon-button"
          aria-label={`${label} ${visible ? '숨기기' : '표시'}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          <Icon name="eye" />
        </button>
      </span>
    </label>
  );
}
