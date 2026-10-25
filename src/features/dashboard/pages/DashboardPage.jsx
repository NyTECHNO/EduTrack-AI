import { useAuth } from '../../auth/AuthContext.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import InstructorDashboard from './InstructorDashboard.jsx';
import StudentDashboard from './StudentDashboard.jsx';
import '../dashboard.css';

// One shared architecture, three role-specific dashboards, all fed by real Firestore data the role is allowed to read.
export default function DashboardPage() {
  const { role } = useAuth();
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'instructor') return <InstructorDashboard />;
  return <StudentDashboard />;
}
