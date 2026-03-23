export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state fade-up">
      {title ? <span className="empty-state__title">{title}</span> : null}
      {description ? <p className="mx-auto max-w-xl text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

