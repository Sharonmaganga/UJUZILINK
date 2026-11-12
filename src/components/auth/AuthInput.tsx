import Icon, { type IconName } from "../Icon";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
  /** Leading icon inside the field */
  icon?: IconName;
  /** Validation message, shown under the field and linked via errorId */
  error?: string;
  errorId?: string;
  /** Helper text, replaced by the error when there is one */
  hint?: React.ReactNode;
  /** A custom control (e.g. PasswordInput) in place of the plain input */
  control?: React.ReactNode;
};

/** Labelled, icon-led field shared by the login and registration forms. */
export default function AuthInput({ label, icon, error, errorId, hint, control, ...input }: Props) {
  return (
    <label className="field">
      <span>{label}</span>
      {control ?? (
        <div className="input-wrap has-icon">
          {icon && <Icon name={icon} className="input-icon" />}
          <input {...input} />
        </div>
      )}
      {error ? (
        <span className="field-error" id={errorId}>
          <Icon name="alert" /> {error}
        </span>
      ) : (
        hint && <span className="hint">{hint}</span>
      )}
    </label>
  );
}
