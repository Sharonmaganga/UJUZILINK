import Icon from "../Icon";

/** Full-width dark-green submit button with a busy state, shared by the auth forms. */
export default function AuthButton({
  loading,
  loadingLabel,
  children,
  ...button
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { loading?: boolean; loadingLabel?: string }) {
  return (
    <button className="btn lg block" disabled={loading} {...button}>
      {loading ? (
        <>
          <Icon name="loader" className="spin" /> {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
