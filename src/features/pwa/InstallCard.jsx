import useInstallPrompt from './useInstallPrompt.js';

// `compact` is the small hint on the login page; the full card lives in Settings.
export default function InstallCard({ compact = false }) {
  const { canInstall, install, installed, ios } = useInstallPrompt();

  if (compact) {
    if (installed || (!canInstall && !ios)) return null;
    return (
      <div className="install install--compact">
        {canInstall
          ? <button type="button" className="btn btn--ghost btn--block" onClick={install}>Install the app</button>
          : <p className="muted small">To install on iPhone or iPad: tap Share, then Add to Home Screen.</p>}
      </div>
    );
  }

  return (
    <div className="card stack install">
      <h2 className="section-title">Install the app</h2>
      {installed ? <p>EduTrack AI is installed on this device. Open it from your home screen or app list.</p> : (
        <>
          <p>Install EduTrack AI like an app: it opens in its own window, starts from your home screen or desktop, and keeps working when the connection drops.</p>
          {canInstall && <div><button type="button" className="btn btn--primary" onClick={install}>Install app</button></div>}
          {!canInstall && ios && <p className="muted small">On iPhone or iPad: tap the Share button in Safari, then <strong>Add to Home Screen</strong>.</p>}
          {!canInstall && !ios && (
            <p className="muted small">In Chrome or Edge, choose <strong>Install app</strong> from the address bar or the ⋮ menu. On Android, choose <strong>Add to Home screen</strong>. The app can only be installed from its secure (https) address.</p>
          )}
        </>
      )}
    </div>
  );
}
