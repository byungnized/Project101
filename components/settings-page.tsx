'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/lib/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { deleteUserData, exportUserData } from '@/lib/firestore';

export function SettingsPageClient() {
  const { user, signOutUser } = useAuth();
  const [exportText, setExportText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthGuard>
      <AppShell>
        <section className="panel">
          <h1>Settings & Privacy</h1>
          <div className="small muted">
            Export/delete is provided for user-controlled data stored in Firebase. Users can also revoke OAuth access from their Google account.
          </div>
        </section>

        <section className="grid-2">
          <div className="panel stack">
            <h2>Data Export</h2>
            <div className="small muted">Exports groups, channel mappings, and stored video metadata/status from Firestore.</div>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy || !user}
              onClick={async () => {
                if (!user) return;
                setBusy(true);
                setMessage(null);
                setError(null);
                try {
                  const payload = await exportUserData(user.uid);
                  setExportText(JSON.stringify(payload, null, 2));
                  setMessage('Export generated below.');
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Export failed');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Generate Export JSON
            </button>
            {message ? <div className="small" style={{ color: 'var(--accent)' }}>{message}</div> : null}
          </div>

          <div className="panel stack">
            <h2>Delete Stored Data</h2>
            <div className="small muted">Deletes your stored app data in Firestore and records a deletion request audit document.</div>
            <button
              className="btn btn-danger"
              type="button"
              disabled={busy || !user}
              onClick={async () => {
                if (!user) return;
                const ok = window.confirm('Delete all stored groups/channels/videos for this account?');
                if (!ok) return;
                setBusy(true);
                setMessage(null);
                setError(null);
                try {
                  await deleteUserData(user.uid);
                  setExportText('');
                  setMessage('Stored data deleted. You can now revoke OAuth access from Google if desired.');
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Deletion failed');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete My Data
            </button>
            <button className="btn" type="button" onClick={() => void signOutUser()}>
              Sign out
            </button>
            <div className="small muted">
              Revoke access path (manual): Google Account → Security → Third-party apps and services → Remove access.
            </div>
          </div>
        </section>

        {error ? (
          <section className="panel"><div className="small" style={{ color: 'var(--danger)' }}>{error}</div></section>
        ) : null}

        <section className="panel">
          <h2>Export Payload</h2>
          {exportText ? (
            <textarea className="textarea" value={exportText} readOnly style={{ minHeight: 360 }} />
          ) : (
            <div className="empty-state">No export generated yet.</div>
          )}
        </section>
      </AppShell>
    </AuthGuard>
  );
}
