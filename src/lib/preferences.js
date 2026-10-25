// Stored in users/{uid}.preferences. Missing values mean "on", so new people get reminders by default.
export function getNotificationPrefs(profile) {
  const n = profile?.preferences?.notifications || {};
  return { classReminders: n.classReminders !== false, cancellations: n.cancellations !== false, browser: n.browser !== false };
}
