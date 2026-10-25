import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.js';
import { logActivity } from '../../activity/services/activityService.js';
import { computeGrade, resolveFinal } from '../../../lib/gradeCalculator.js';

// settings/grading                              school-wide grading policy (Admin writes)
// gradebooks/{scheduleId_periodId}              method + category weights for one class and period
// assessments/{id}                              a quiz/activity/assignment/exam and its max score
// grades/{scheduleId_periodId_studentId}        one student's scores, computed result, manual grade and official final
const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
export const gradebookId = (scheduleId, periodId) => `${scheduleId}_${periodId}`;
export const gradeId = (scheduleId, periodId, studentId) => `${scheduleId}_${periodId}_${studentId}`;

export async function fetchSettings() {
  const snap = await getDoc(doc(db, 'settings', 'grading'));
  return snap.exists() ? snap.data() : null;
}
export async function saveSettings(settings, uid) {
  await setDoc(doc(db, 'settings', 'grading'), { ...settings, updatedBy: uid, updatedAt: serverTimestamp() });
  logActivity({ action: 'grading.settings', summary: `Saved the grading settings (${settings.periods.length} periods, passing mark ${settings.scale.passingMark})`, targetType: 'settings', targetId: 'grading' });
}

export async function fetchGradebookData(scheduleId, periodId, instructorId) {
  const scope = [where('scheduleId', '==', scheduleId), where('periodId', '==', periodId), where('instructorId', '==', instructorId)];
  const [gb, as, gr] = await Promise.all([
    getDoc(doc(db, 'gradebooks', gradebookId(scheduleId, periodId))),
    getDocs(query(collection(db, 'assessments'), ...scope)),
    getDocs(query(collection(db, 'grades'), ...scope)),
  ]);
  const assessments = mapDocs(as).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  return { gradebook: gb.exists() ? gb.data() : null, assessments, grades: mapDocs(gr) };
}

export const createAssessment = (data) => addDoc(collection(db, 'assessments'), { ...data, createdAt: serverTimestamp() });
export const updateAssessment = (id, data) => updateDoc(doc(db, 'assessments', id), data);
export const deleteAssessment = (id) => deleteDoc(doc(db, 'assessments', id));

/**
 * Saves the gradebook settings and one grade document per student.
 * Each document stores the scores, the computed result (with its breakdown), the manual grade, and the official final,
 * so a student can see everything from a single document. Re-saving is safe (same ids).
 */
export async function saveGradebook({ schedule, period, instructor, method, weights, roster, assessments, scores, manual, remarks, settings }) {
  await setDoc(doc(db, 'gradebooks', gradebookId(schedule.id, period.id)), {
    scheduleId: schedule.id, periodId: period.id, instructorId: instructor.uid, method, weights, updatedAt: serverTimestamp(),
  });

  const writeOne = (p) => {
    const studentScores = scores[p.uid] || {};
    const computed = assessments.length ? computeGrade({ assessments, scores: studentScores, weights, settings }) : null;
    const manualValue = manual[p.uid];
    const manualFinal = manualValue == null ? null : { value: manualValue };
    return setDoc(doc(db, 'grades', gradeId(schedule.id, period.id, p.uid)), {
      scheduleId: schedule.id, periodId: period.id, periodName: period.name, studentId: p.uid, studentName: p.name, idNumber: p.idNumber || '',
      subjectCode: schedule.subjectCode, subjectName: schedule.subjectName, instructorId: instructor.uid, instructorName: instructor.name,
      method, scores: studentScores,
      computed: computed && computed.percentage != null ? { percentage: computed.percentage, grade: computed.grade, breakdown: computed.breakdown, weightUsed: computed.weightUsed, reason: computed.reason } : null,
      manualFinal,
      final: resolveFinal({ method, computed, manualFinal, settings }),
      remarks: (remarks[p.uid] || '').trim(),
      updatedAt: serverTimestamp(),
    });
  };
  for (let i = 0; i < roster.length; i += 10) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(roster.slice(i, i + 10).map(writeOne));
  }
  logActivity({ action: 'grades.saved', summary: `Saved ${method === 'manual' ? 'manual' : 'computed'} grades for ${schedule.subjectCode}, ${period.name} (${roster.length} students)`, targetType: 'grades', targetId: `${schedule.id}_${period.id}` });
}

export async function fetchMyGrades(uid) {
  return mapDocs(await getDocs(query(collection(db, 'grades'), where('studentId', '==', uid))));
}
export async function fetchScheduleGrades(scheduleId) {
  return mapDocs(await getDocs(query(collection(db, 'grades'), where('scheduleId', '==', scheduleId))));
}
