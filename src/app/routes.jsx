import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage.jsx';
import ProtectedRoute from '../features/auth/ProtectedRoute.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import ComingSoonPage from '../features/placeholders/ComingSoonPage.jsx';
import AccountsPage from '../features/users/pages/AccountsPage.jsx';
import SubjectsPage from '../features/subjects/pages/SubjectsPage.jsx';
import SchedulesPage from '../features/schedules/pages/SchedulesPage.jsx';
import AttendancePage from '../features/attendance/pages/AttendancePage.jsx';
import GradesPage from '../features/grades/pages/GradesPage.jsx';
import GradingSettingsPage from '../features/grades/pages/GradingSettingsPage.jsx';
import CalendarPage from '../features/calendar/pages/CalendarPage.jsx';
import ChatbotPage from '../features/chatbot/pages/ChatbotPage.jsx';
import SchoolInfoPage from '../features/school-info/pages/SchoolInfoPage.jsx';
import ProfilePage from '../features/profile/pages/ProfilePage.jsx';
import SettingsPage from '../features/settings/pages/SettingsPage.jsx';
import ActivityPage from '../features/activity/pages/ActivityPage.jsx';
import MySchedulePage from '../features/schedules/pages/MySchedulePage.jsx';
import { ALL_NAV_ITEMS } from '../components/layout/navConfig.js';

// Finished modules are registered here; everything else still shows the placeholder.
const PAGES = {
  '/accounts': AccountsPage,
  '/subjects': SubjectsPage,
  '/schedules': SchedulesPage,
  '/my-schedule': MySchedulePage,
  '/attendance': AttendancePage,
  '/activity': ActivityPage,
  '/profile': ProfilePage,
  '/settings': SettingsPage,
  '/chatbot': ChatbotPage,
  '/school-info': SchoolInfoPage,
  '/calendar': CalendarPage,
  '/grades': GradesPage,
  '/grading-settings': GradingSettingsPage,
};

const moduleItems = ALL_NAV_ITEMS.filter((item) => item.path !== '/dashboard');

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {moduleItems.map((item) => {
            const Page = PAGES[item.path];
            return (
              <Route key={item.path} path={item.path}
                element={<ProtectedRoute roles={item.roles}>{Page ? <Page /> : <ComingSoonPage item={item} />}</ProtectedRoute>} />
            );
          })}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
