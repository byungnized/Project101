export function formatDate(input?: string) {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function formatRelativeDue(input?: string) {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  const diffDays = Math.round((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Due today';
  if (diffDays > 0) return `Due in ${diffDays}d`;
  return `${Math.abs(diffDays)}d overdue`;
}
