import Icon from './Icon.jsx';

export default function FormNotice({ tone = 'info', title, children, innerRef }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'} tabIndex={-1} ref={innerRef}>
      <Icon name="info" size={20} />
      <div>
        <strong>{title}</strong>
        {children ? <p>{children}</p> : null}
      </div>
    </div>
  );
}
