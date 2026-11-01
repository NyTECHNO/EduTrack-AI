# Firestore schema

IDs shown as `a_b` are deterministic, which is how duplicates are prevented.

| Collection / document | Key fields | Who writes | Who reads |
|---|---|---|---|
| `users/{uid}` | email (for ID accounts an internal address, never shown), displayName, role (admin/instructor/student), status (active/inactive), idNumber, phone, preferences, createdBy, createdAt | Admin creates and edits; a person edits own phone/preferences (Admin may edit own name) | Self, Admin |
| `subjects/{id}` | code, name, units, description, status (active/archived) | Admin | Any active user |
| `schedules/{id}` | subjectId, subjectCode, subjectName, instructorId, instructorName, section, days[Mon..Sun], startTime/endTime "HH:MM", room, termStart/termEnd, status (active/cancelled), statusChangedAt, **studentIds[]** (uids only) | Admin | Admin; the class's instructor; students listed in studentIds |
| `rosters/{scheduleId}` | scheduleId, instructorId, enrolled[{uid,name,idNumber}], studentIds[] | Admin | Admin; the class's instructor (never students) |
| `attendanceSessions/{scheduleId_date}` | scheduleId, subjectCode/Name, section, instructorId/Name, date "YYYY-MM-DD", note, counts{present,absent,late,excused,total} | Instructor of that class | Admin; that instructor |
| `attendanceSessions/{id}/records/{studentId}` | studentId, studentName, idNumber, status, remarks, scheduleId, sessionId, date, subjectCode/Name, instructorId/Name | Instructor of that class | Admin; that instructor; the student (own record) |
| `settings/grading` | periods[{id,name}], scale{min,max,passingMark,higherIsBetter}, rounding{decimals,mode}, missingScores, categories[{id,name,weight}], conversion[{minPercent,grade}] | Admin | Any active user |
| `gradebooks/{scheduleId_periodId}` | scheduleId, periodId, instructorId, method (computed/manual), weights{categoryId: %} | Instructor of that class | Admin; that instructor |
| `assessments/{id}` | scheduleId, periodId, instructorId, category, title, maxScore | Instructor of that class | Admin; that instructor |
| `grades/{scheduleId_periodId_studentId}` | scores{assessmentId: n}, computed{percentage,grade,breakdown,...}, manualFinal{value}, **final**{value,status,method}, method, remarks, periodName, student/subject/instructor copies | Instructor of that class (enrolled students only) | Admin; that instructor; the student (own) |
| `notifications/{uid_date_scheduleId_time}` | userId, type (class-reminder/class-cancelled), title, body, scheduleId, classDate, read, delivery{inApp,browser}, createdAt | The person themself | The person |
| `activityLog/{id}` | actorId, actorName, actorRole, action, summary (max 300 chars), targetType, targetId, createdAt | Any active user, only about their own action | Admin only. Entries can never be edited or deleted |
| `conversations/{id}` | type (direct/group), memberIds[], invitedIds[] (group invitations not yet answered), participantIds[] (members + invited), names{uid: name} (direct), scheduleId/subjectCode/subjectName/section/title/instructorId/instructorName (group), lastMessage{text,senderId,senderName}, lastMessageAt. Direct id = `dm_<uidA>_<uidB>` (Admin and Instructor only); group id = `group_<scheduleId>` | Admin/Instructor create direct; the class's Instructor creates the group and invites; invited students accept or decline; members update the last message | Members; invited students can read the group they were invited to |
| `conversations/{id}/messages/{id}` | senderId, senderName, senderRole, text (max 2000), createdAt | Members (as themselves) | Members. Messages can never be edited or deleted |
| `groupChatPrompts/{scheduleId}` | scheduleId, instructorId, status ('declined'), updatedAt | The class's Instructor | The class's Instructor |
| `schoolKnowledge/{id}` | category (history, background, mission-vision, core-values, programs, admissions, contact, community, administration), title, content, keywords[], sourceUrl, reviewNote, status (draft/published) | Admin | Admin (all); others (published only) |

## Denormalized copies (and how they stay correct)

- Subject code/name inside `schedules`, attendance and grades: updated for schedules when a subject is renamed; past attendance/grade records keep the name they were saved with.
- Instructor/student names in `schedules` and `rosters`: updated when an Admin renames an account (`syncPersonName`). Past attendance and grade records keep the saved name.
- `periodName` in `grades`: stored so a student still sees the period after the Admin renames it.
- Computed results in `grades.computed` are a snapshot made when the instructor saves.

## Indexes (`firestore.indexes.json`)

- Collection-group single-field indexes on `records`: `studentId`, `instructorId`, `scheduleId` (reports and a student's own history).
- Composite on `notifications`: `userId` ascending + `createdAt` descending.
- Everything else uses automatic single-field indexes.
