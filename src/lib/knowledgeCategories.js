// Knowledge-base categories. Yearly events are deliberately NOT a category (dates change every year).
// `words` are the question words that point to a category; they are matched after the same stemming as the entries.
export const KB_CATEGORIES = [
  { id: 'history', label: 'School History', example: 'What is the history of the school?',
    words: ['history', 'historical', 'founded', 'founder', 'founding', 'established', 'started', 'beginning', 'origin', 'timeline', 'kasaysayan', 'itinatag', 'nagsimula'] },
  { id: 'background', label: 'School Background', example: 'Tell me about the school.',
    words: ['background', 'about', 'overview', 'location', 'located', 'address', 'where', 'hours', 'campus', 'motto', 'tagline', 'glance'] },
  { id: 'mission-vision', label: 'Mission and Vision', example: 'What are the mission and vision?',
    words: ['mission', 'vision', 'goal', 'objective', 'purpose', 'misyon', 'bisyon'] },
  { id: 'core-values', label: 'Core Values', example: 'What are the core values?',
    words: ['value', 'values', 'core', 'principle', 'belief', 'halaga'] },
  { id: 'programs', label: 'Programs / Courses', example: 'What programs and courses are offered?',
    words: ['program', 'programs', 'course', 'courses', 'degree', 'offer', 'offered', 'offering', 'strand', 'tesda', 'ched', 'curriculum', 'kurso', 'programa', 'elementary', 'secondary', 'montessori'] },
  { id: 'admissions', label: 'Admissions', example: 'What are the admission requirements?',
    words: ['admission', 'admissions', 'enroll', 'enrollment', 'enrol', 'requirement', 'requirements', 'apply', 'application', 'registration', 'register', 'form', 'forms'] },
  { id: 'contact', label: 'Contact Information', example: 'How can I contact the school?',
    words: ['contact', 'phone', 'call', 'telephone', 'mobile', 'email', 'facebook', 'youtube', 'hotline', 'reach'] },
  { id: 'community', label: 'Community Programs', example: 'What community programs does the school have?',
    words: ['community', 'outreach', 'extension', 'charity', 'scholarship', 'scholarships', 'freed', 'hope', 'empowered', 'initiative', 'indigenous'] },
  { id: 'administration', label: 'Administration and Offices', example: 'Who is the school president?',
    words: ['president', 'vice', 'leadership', 'administration', 'registrar', 'head', 'officer', 'office', 'offices', 'staff'] },
];
export const categoryLabel = (id) => KB_CATEGORIES.find((c) => c.id === id)?.label || id;
