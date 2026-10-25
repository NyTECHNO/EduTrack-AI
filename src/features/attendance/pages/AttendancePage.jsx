import { useAuth } from '../../auth/AuthContext.jsx';
import StudentAttendance from './StudentAttendance.jsx';
import InstructorAttendance from './InstructorAttendance.jsx';
import AdminAttendance from './AdminAttendance.jsx';

// One /attendance route; the verified role decides which screen loads.
export default function AttendancePage() {
  const { role } = useAuth();
  if (role === 'student') return <StudentAttendance />;
  if (role === 'instructor') return <InstructorAttendance />;
  return <AdminAttendance />;
}
