import { useAuth } from '../../auth/AuthContext.jsx';
import useGradingSettings from '../hooks/useGradingSettings.js';
import StudentGrades from './StudentGrades.jsx';
import InstructorGrades from './InstructorGrades.jsx';
import AdminGrades from './AdminGrades.jsx';

// One /grades route; the verified role decides which screen loads.
export default function GradesPage() {
  const { role } = useAuth();
  const { loading, settings, error } = useGradingSettings();

  if (loading) return <section className="page__section"><p className="muted" role="status">Loading…</p></section>;
  if (error) return <section className="page__section"><p className="alert alert--error" role="alert">{error}</p></section>;
  if (role === 'student') return <StudentGrades settings={settings} />;
  if (role === 'admin') return <AdminGrades settings={settings} />;

  if (!settings) {
    return (
      <section className="page__section">
        <h1 className="page__title">Grades</h1>
        <div className="card empty"><p><strong>Grading has not been set up yet.</strong></p>
          <p className="muted">The administrator must save the school's grading settings first.</p></div>
      </section>
    );
  }
  return <InstructorGrades settings={settings} />;
}
