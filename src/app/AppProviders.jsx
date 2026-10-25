import { BrowserRouter } from 'react-router-dom';
import useTheme from '../hooks/useTheme.js';
import { AuthProvider } from '../features/auth/AuthContext.jsx';

export default function AppProviders({ children }) {
  useTheme(); // applies the saved theme to the whole app, including the login page
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
}
