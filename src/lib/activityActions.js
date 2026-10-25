// Every action that is written to the activity log, with a plain-language label and a group for filtering.
export const ACTIONS = {
  'account.created': { label: 'Account created', group: 'accounts' },
  'account.updated': { label: 'Account updated', group: 'accounts' },
  'account.deactivated': { label: 'Account deactivated', group: 'accounts' },
  'account.reactivated': { label: 'Account reactivated', group: 'accounts' },
  'account.reset': { label: 'Password reset sent', group: 'accounts' },
  'subject.created': { label: 'Subject created', group: 'subjects' },
  'subject.updated': { label: 'Subject updated', group: 'subjects' },
  'subject.archived': { label: 'Subject archived', group: 'subjects' },
  'subject.restored': { label: 'Subject restored', group: 'subjects' },
  'schedule.created': { label: 'Schedule created', group: 'schedules' },
  'schedule.updated': { label: 'Schedule updated', group: 'schedules' },
  'schedule.cancelled': { label: 'Class cancelled', group: 'schedules' },
  'schedule.reinstated': { label: 'Class reinstated', group: 'schedules' },
  'schedule.deleted': { label: 'Schedule deleted', group: 'schedules' },
  'schedule.enrollment': { label: 'Enrollment changed', group: 'schedules' },
  'attendance.saved': { label: 'Attendance recorded', group: 'attendance' },
  'attendance.corrected': { label: 'Attendance corrected', group: 'attendance' },
  'grades.saved': { label: 'Grades saved', group: 'grades' },
  'grading.settings': { label: 'Grading settings saved', group: 'grades' },
  'knowledge.saved': { label: 'School information saved', group: 'knowledge' },
  'knowledge.published': { label: 'School information published', group: 'knowledge' },
  'knowledge.unpublished': { label: 'School information unpublished', group: 'knowledge' },
  'knowledge.deleted': { label: 'School information deleted', group: 'knowledge' },
  'knowledge.imported': { label: 'School information imported', group: 'knowledge' },
};
export const GROUPS = [
  ['accounts', 'Accounts'], ['subjects', 'Subjects'], ['schedules', 'Schedules'],
  ['attendance', 'Attendance'], ['grades', 'Grades'], ['knowledge', 'School information'],
];
export const actionLabel = (action) => ACTIONS[action]?.label || action;
export const actionGroup = (action) => ACTIONS[action]?.group || 'other';
