import { getDocs, limit, startAfter } from 'firebase/firestore';

// Reads EVERY matching document by walking pages of `pageSize`, instead of silently stopping at a cap.
// `makeQuery(...extraConstraints)` must build the query (with its own orderBy/where) and append the extras.
// `max` is a safety stop so a runaway collection cannot freeze a browser tab.
export async function getAllDocs(makeQuery, { pageSize = 500, max = 10000 } = {}) {
  const docs = [];
  let last = null;
  while (docs.length < max) {
    // eslint-disable-next-line no-await-in-loop
    const snap = await getDocs(makeQuery(...(last ? [startAfter(last), limit(pageSize)] : [limit(pageSize)])));
    docs.push(...snap.docs);
    if (snap.docs.length < pageSize) break;
    last = snap.docs[snap.docs.length - 1];
  }
  return docs.map((d) => ({ id: d.id, ...d.data() }));
}
