import { useCallback, useEffect, useMemo, useState } from 'react';
import ShowMore from '../../../components/ui/ShowMore.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import AccountForm from '../components/AccountForm.jsx';
import {
  createAccount, updateAccount, setAccountStatus, sendResetEmail, fetchAccounts, describeServiceError,
} from '../services/accountsService.js';

const ROLE_LABEL = { admin: 'Admin', instructor: 'Instructor', student: 'Student' };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [rows, setRows] = useState(50);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null); // { type: 'ok' | 'error', text }
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(null);           // null | { account? }
  const [credentials, setCredentials] = useState(null); // { email, password }
  const [confirm, setConfirm] = useState(null);     // account awaiting (de)activation
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setAccounts(await fetchAccounts());
    } catch {
      setLoadError('Could not load accounts. Check your connection and that the Firestore rules are deployed.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setRows(50); }, [search, roleFilter, statusFilter]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) =>
      (roleFilter === 'all' || a.role === roleFilter) &&
      (statusFilter === 'all' || a.status === statusFilter) &&
      (!q || [a.displayName, a.email, a.idNumber].some((v) => v?.toLowerCase().includes(q))));
  }, [accounts, search, roleFilter, statusFilter]);

  const counts = useMemo(() => ({
    students: accounts.filter((a) => a.role === 'student' && a.status === 'active').length,
    instructors: accounts.filter((a) => a.role === 'instructor' && a.status === 'active').length,
  }), [accounts]);

  async function handleSave(values) {
    try {
      if (form.account) {
        await updateAccount({ uid: form.account.id, previous: form.account, displayName: values.displayName, role: values.role, idNumber: values.idNumber, phone: values.phone });
        setNotice({ type: 'ok', text: 'Account updated.' });
      } else {
        await createAccount({
          email: values.email, displayName: values.displayName, role: values.role, password: values.password,
          details: { idNumber: values.idNumber, phone: values.phone },
        });
        setCredentials({ email: values.email.trim().toLowerCase(), password: values.password });
        setNotice({ type: 'ok', text: 'Account created.' });
      }
      setForm(null);
      load();
    } catch (err) {
      throw new Error(describeServiceError(err));
    }
  }

  async function handleToggleStatus() {
    const account = confirm;
    const next = account.status === 'active' ? 'inactive' : 'active';
    setWorking(true);
    try {
      await setAccountStatus({ uid: account.id, status: next, name: account.displayName });
      setNotice({ type: 'ok', text: next === 'inactive' ? 'Account deactivated.' : 'Account reactivated.' });
      setConfirm(null);
      load();
    } catch (err) {
      setNotice({ type: 'error', text: describeServiceError(err) });
      setConfirm(null);
    } finally {
      setWorking(false);
    }
  }

  async function handleReset(account) {
    try {
      await sendResetEmail(account.email);
      setNotice({ type: 'ok', text: `Password reset email sent to ${account.email}.` });
    } catch {
      setNotice({ type: 'error', text: 'Could not send the reset email. Try again later.' });
    }
  }

  const copy = (text) => navigator.clipboard?.writeText(text).catch(() => {});

  return (
    <section className="page__section">
      <div className="page__head">
        <div>
          <h1 className="page__title">Accounts</h1>
          <p className="muted">{counts.students} active students · {counts.instructors} active instructors</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setForm({})}>New account</button>
      </div>

      {notice && <p className={`alert alert--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}

      <div className="toolbar">
        <input type="search" className="toolbar__search" placeholder="Search name, email or ID number" value={search}
          onChange={(e) => setSearch(e.target.value)} aria-label="Search accounts" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role">
          <option value="all">All roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? <p className="muted" role="status">Loading accounts…</p>
        : loadError ? (
          <div className="card empty"><p className="alert alert--error">{loadError}</p>
            <button type="button" className="btn btn--ghost" onClick={load}>Try again</button></div>
        ) : visible.length === 0 ? (
          <div className="card empty">
            <p><strong>{accounts.length ? 'No accounts match your filters.' : 'No accounts yet.'}</strong></p>
            {!accounts.length && <p className="muted">Create the first Student or Instructor account.</p>}
          </div>
        ) : (
          <div className="card table-card">
            <table className="table">
              <thead><tr><th>Name</th><th>Role</th><th>ID number</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {visible.slice(0, rows).map((a) => {
                  const isAdmin = a.role === 'admin';
                  return (
                    <tr key={a.id}>
                      <td data-label="Name"><strong>{a.displayName}</strong><br /><span className="muted">{a.email}</span></td>
                      <td data-label="Role">{ROLE_LABEL[a.role] || a.role}</td>
                      <td data-label="ID number">{a.idNumber || '—'}</td>
                      <td data-label="Status"><span className={`badge badge--${a.status === 'active' ? 'ok' : 'off'}`}>{a.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                      <td data-label="Actions"><div className="rowactions">
                        {isAdmin ? <span className="muted">Not editable here</span> : (<>
                          <button type="button" className="btn btn--ghost btn--small" onClick={() => setForm({ account: a })}>Edit</button>
                          <button type="button" className="btn btn--ghost btn--small" onClick={() => handleReset(a)}>Reset password</button>
                          <button type="button" className={`btn btn--small ${a.status === 'active' ? 'btn--danger' : 'btn--ghost'}`} onClick={() => setConfirm(a)}>
                            {a.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </>)}
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ShowMore total={visible.length} shown={rows} onMore={() => setRows((n) => n + 50)} />
          </div>
        )}

      {form && <AccountForm account={form.account} onSubmit={handleSave} onClose={() => setForm(null)} />}

      {credentials && (
        <Modal title="Account created" onClose={() => setCredentials(null)}
          footer={<button type="button" className="btn btn--primary" onClick={() => setCredentials(null)}>Done</button>}>
          <p>Give these sign-in details to the user. The password is shown only now and is not saved anywhere.</p>
          <dl className="creds">
            <dt>Email</dt><dd>{credentials.email}</dd>
            <dt>Temporary password</dt><dd><code>{credentials.password}</code></dd>
          </dl>
          <button type="button" className="btn btn--ghost" onClick={() => copy(`Email: ${credentials.email}\nPassword: ${credentials.password}`)}>Copy details</button>
        </Modal>
      )}

      {confirm && (
        <Modal title={confirm.status === 'active' ? 'Deactivate account?' : 'Reactivate account?'} onClose={() => setConfirm(null)}
          footer={<>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
            <button type="button" className={`btn ${confirm.status === 'active' ? 'btn--danger' : 'btn--primary'}`} onClick={handleToggleStatus} disabled={working}>
              {working ? 'Working…' : confirm.status === 'active' ? 'Deactivate' : 'Reactivate'}
            </button>
          </>}>
          <p>{confirm.status === 'active'
            ? `${confirm.displayName} will be signed out and unable to sign in until you reactivate the account. Their records are kept.`
            : `${confirm.displayName} will be able to sign in again.`}</p>
        </Modal>
      )}
    </section>
  );
}
