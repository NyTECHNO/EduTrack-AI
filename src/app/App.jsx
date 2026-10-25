import AppProviders from './AppProviders.jsx';
import AppRoutes from './routes.jsx';
import ErrorBoundary from '../components/ui/ErrorBoundary.jsx';

export default function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </AppProviders>
  );
}
