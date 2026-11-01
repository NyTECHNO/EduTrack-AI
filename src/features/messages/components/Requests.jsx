import { scheduleTitle } from '../services/messagesService.js';

// Things that need an answer: students are invited to join a subject group chat; instructors are
// asked by the system whether to create one. Both can accept or decline.
export function StudentInvites({ invites, busyId, onAccept, onDecline }) {
  if (invites.length === 0) return null;
  return (
    <section className="msgreq" aria-label="Group chat invitations">
      <h2 className="msgreq__title">Group chat invitations</h2>
      <ul className="msgreq__list">
        {invites.map((c) => (
          <li key={c.id} className="msgreq__item">
            <div>
              <strong>{c.title}</strong>
              <p className="msgreq__text">{c.instructorName} invited you to join the group chat for this subject.</p>
            </div>
            <div className="rowactions">
              <button type="button" className="btn btn--primary btn--small" disabled={busyId === c.id} onClick={() => onAccept(c)}>Accept</button>
              <button type="button" className="btn btn--ghost btn--small" disabled={busyId === c.id} onClick={() => onDecline(c)}>Decline</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GroupSuggestions({ suggestions, declined, busyId, onAccept, onDecline }) {
  if (suggestions.length === 0 && declined.length === 0) return null;
  const count = (s) => (s.studentIds || []).length;
  return (
    <section className="msgreq" aria-label="Group chat suggestions">
      {suggestions.length > 0 && (
        <>
          <h2 className="msgreq__title">Create a group chat?</h2>
          <ul className="msgreq__list">
            {suggestions.map((s) => (
              <li key={s.id} className="msgreq__item">
                <div>
                  <strong>{scheduleTitle(s)}</strong>
                  <p className="msgreq__text">EduTrack AI suggests a group chat for this subject. {count(s)} enrolled student{count(s) === 1 ? '' : 's'} will be invited and can accept or decline.</p>
                </div>
                <div className="rowactions">
                  <button type="button" className="btn btn--primary btn--small" disabled={busyId === s.id} onClick={() => onAccept(s, false)}>Accept</button>
                  <button type="button" className="btn btn--ghost btn--small" disabled={busyId === s.id} onClick={() => onDecline(s)}>Decline</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {declined.length > 0 && (
        <details className="msgreq__declined">
          <summary>Declined suggestions ({declined.length})</summary>
          <ul className="msgreq__list">
            {declined.map((s) => (
              <li key={s.id} className="msgreq__item">
                <strong>{scheduleTitle(s)}</strong>
                <div className="rowactions">
                  <button type="button" className="btn btn--ghost btn--small" disabled={busyId === s.id} onClick={() => onAccept(s, true)}>Create group chat</button>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
