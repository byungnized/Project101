'use client';

import { useState } from 'react';
import type { Group } from '@/lib/types';

type GroupFormValues = {
  name: string;
  description: string;
  color: string;
};

export function GroupForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<GroupFormValues>;
  submitLabel: string;
  onSubmit: (values: GroupFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<GroupFormValues>({
    name: initial?.name || '',
    description: initial?.description || '',
    color: initial?.color || '#0f6d5d',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(values);
      if (!initial) {
        setValues({ name: '', description: '', color: '#0f6d5d' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <input
        className="input"
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        placeholder="Group name (e.g., Stock Study)"
        required
      />
      <textarea
        className="textarea"
        value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        placeholder="Goal, learning focus, or review cadence notes"
      />
      <div className="row">
        <label className="small muted" htmlFor="group-color">Accent color</label>
        <input
          id="group-color"
          type="color"
          value={values.color}
          onChange={(e) => setValues((v) => ({ ...v, color: e.target.value }))}
        />
      </div>
      {error ? <div className="small" style={{ color: 'var(--danger)' }}>{error}</div> : null}
      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
