import { Component } from 'react';

// Last line of defence: a bug in one screen shows a clear message instead of a blank page.
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('EduTrack AI error:', error); } // eslint-disable-line no-console
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="fatal" role="alert">
        <div>
          <h1>Something went wrong</h1>
          <p className="muted">The page hit an unexpected problem. Your data is safe. Reload to try again.</p>
          <button type="button" className="btn btn--primary" onClick={() => window.location.assign('/dashboard')}>Reload</button>
        </div>
      </div>
    );
  }
}
