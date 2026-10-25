// Starting point prepared from https://johnpaulcollege.edu.ph (checked October 2026). Everything is imported as a DRAFT:
// the chatbot never uses drafts until an Admin reviews, edits (ideally pasting the official wording) and publishes them.
// The website never lists "core values" as such, so the Core Values entry below is clearly labelled as the closest published statement.
const SITE = 'https://johnpaulcollege.edu.ph';

// Older suggested entries that newer ones replace. If already in the database they are moved back to draft with a note.
export const SUPERSEDED_IDS = ['seed-programs-college'];

export const SUGGESTED_DRAFTS = [
  {
    id: 'seed-history', category: 'history', title: 'History of John Paul College',
    keywords: ['founded', 'established', '1996', '1998', 'montessori', 'timeline', 'beginning'],
    content: [
      'John Paul College began as John Paul Montessori School, Inc., conceived in January 1996 by two educators who wanted children in Roxas to receive an education on par with city schools. Engr. Manuel G. Andaya and Mrs. Rosalina S. Andaya supported the idea, and the Securities and Exchange Commission approved the corporation on June 3, 1996. The school started with pre-school classes (Casa, Junior Casa and Senior Casa).',
      'The elementary department opened in 1997. In 1998 the College Department and the High School Department were inaugurated under John Paul College Corporation at the MG Andaya Compound in Odiong, Roxas, on a 3.5-hectare site, together with technical-vocational courses approved by TESDA.',
      'Later milestones on the school timeline include CHED permits for degree programs in 1999, adoption of the K to 12 curriculum in 2011, ISO 9001:2008 certification in 2014, and a permit to offer Senior High School in 2015.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/historical-timeline/`,
    reviewNote: 'Paraphrased summary of the website timeline. Add any later milestones the school wants included.',
  },
  {
    id: 'seed-background', category: 'background', title: 'About John Paul College',
    keywords: ['location', 'address', 'hours', 'tagline', 'inspired', 'st. john paul ii'],
    content: [
      'John Paul College is located at MG Andaya Compound, Odiong, Roxas, Oriental Mindoro. The school’s website says it is inspired by the teachings and philosophy of St. John Paul II, and its tagline is “We Nurture. We Empower. We Inspire.”',
      'The website lists office hours as Monday to Friday, 8:00 AM to 5:00 PM, and closed on Saturdays and Sundays.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/home/`,
    reviewNote: 'Office hours were taken from the website footer. Confirm they are current.',
  },
  {
    id: 'seed-mission', category: 'mission-vision', title: 'Mission of John Paul College',
    keywords: ['mission', 'goal', 'purpose', 'graduates'],
    content: [
      'John Paul College aims to be a leading academic center, especially in Southern Mindoro. It plans to provide quality education through competent people, responsiveness to community needs, up-to-date technology, and cooperation with other institutions.',
      'It aims to produce graduates who are righteous, self-reliant, ecologically sensible and fully competitive, while promoting innovation and protecting Mindoro’s indigenous cultural heritage through research and community service.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/elementor-about-2/`,
    reviewNote: 'This is a paraphrase. For an official statement, replace it with the exact wording from the school’s approved document.',
  },
  {
    id: 'seed-vision', category: 'mission-vision', title: 'Vision of John Paul College',
    keywords: ['vision', 'excellence', 'john paul ii'],
    content: 'Founded in 1998, John Paul College sees itself as the center of learning and academic excellence in the Province of Oriental Mindoro. Guided by the ideals of John Paul II (self-giving, social justice, love of nature and intellectual toughness), it aims to form well-rounded individuals who live up to Christian faith standards.',
    sourceUrl: `${SITE}/elementor-about-2/`,
    reviewNote: 'This is a paraphrase. For an official statement, replace it with the exact approved wording.',
  },
  {
    id: 'seed-programs-levels', category: 'programs', title: 'Education levels offered',
    keywords: ['pre-elementary', 'montessori', 'elementary', 'junior high', 'senior high', 'k to 12', 'levels'],
    content: [
      'According to the school website, John Paul College offers four levels: a two-year Montessori pre-elementary program (Junior Casa for ages 3–4 and Senior Casa for ages 5–6), elementary from Grade 1 to Grade 6, secondary education (4 years of Junior High School and 2 years of Senior High School, following the K to 12 program), and college.',
      'The college level includes degree programs under CHED and vocational programs under TESDA.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/home/`,
    reviewNote: '',
  },
  {
    id: 'seed-programs-tesda', category: 'programs', title: 'TESDA technical-vocational programs',
    keywords: ['tesda', 'vocational', 'cookery', 'housekeeping', 'food and beverage', 'driving', 'nc ii'],
    content: 'The website lists these TESDA programs as open: Housekeeping NC II, Cookery NC II, Events Management Services NC III, Food and Beverage Services NC II, and Driving NC II, plus Entrepreneurship Development Training Programs. Listed as opening soon: Bread and Pastry Production NC II, Bookkeeping NC II, Front Office Services NC II, Computer System Servicing NC II, and Hilot (Wellness Massage) NC II.',
    sourceUrl: `${SITE}/tesda/`,
    reviewNote: 'Open and “soon to open” lists change. Confirm the current list before publishing.',
  },
  {
    id: 'seed-guiding-principles', category: 'core-values', title: 'Guiding principles (educational philosophy)',
    keywords: ['core values', 'values', 'principles', 'philosophy', 'precepts', 'faith', 'reason', 'st. john paul ii'],
    content: [
      'The school website does not publish a separate list of core values. It does describe the educational philosophy that guides John Paul College, inspired by St. John Paul II, through three precepts.',
      '1. Act on goals today. The school’s tagline, “The future starts today, not tomorrow,” encourages students to act on their goals now instead of waiting.',
      '2. Person-centered education. Education gives importance to the person, action, community, solidarity and participation, with attention to each student’s personal experience.',
      '3. Faith and reason. Both are seen as essential for growing in knowledge and wisdom, and growth in relationship with God comes through loving knowledge, striving for virtue and caring for others.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/about/`,
    reviewNote: 'The website mentions “core values” in its institutional goals but never lists them. These are the closest published statements. If the school has an official core values list, replace this entry with it.',
  },
  {
    id: 'seed-goals', category: 'background', title: 'Institutional goals, objectives and quality policy',
    keywords: ['goals', 'objectives', 'quality policy', 'accreditation', 'community'],
    content: [
      'Institutional goals listed on the website: create a school environment that supports quality learning; offer education that responds to community needs, technological advances and global change; integrate the school’s core values in human relations in line with the ideals of St. John Paul II; be a partner of local communities for transformation and a better quality of life; and maintain a good image so others adopt JPC ideals, principles and values.',
      'Institutional objectives: provide reliable facilities, laboratories and equipment; keep developing its people to meet student needs, academic demands and regulatory standards; keep curricula updated; engage in relevant research; and give relevant social services to identified communities.',
      'Quality policy: the college commits to quality education by keeping its established standards while staying open to improvement. Instruction, research and community extension are meant to meet accreditation requirements and local and international regulatory standards, and its programs are monitored, evaluated and updated.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/about/`,
    reviewNote: 'Paraphrased from the About page. Replace with exact official wording if you need formal statements.',
  },
  {
    id: 'jpc-programs-ched', category: 'programs', title: 'College degree programs (CHED)',
    keywords: ['degree', 'college', 'bachelor', 'accountancy', 'business administration', 'customs administration', 'tourism', 'civil engineering', 'architecture', 'computer science', 'information technology', 'computer engineering', 'library science', 'criminology', 'secondary education', 'physical education', 'cabm', 'ceats', 'ccrim', 'ced'],
    content: [
      'John Paul College offers CHED degree programs through four colleges.',
      'College of Accountancy, Business and Management (CABM): Bachelor of Science in Accountancy; Bachelor of Science in Business Administration major in Financial Management; Bachelor of Science in Business Administration major in Marketing Management; Bachelor of Science in Customs Administration; Bachelor of Science in Tourism Management.',
      'College of Engineering, Architecture, Technology and Science (CEATS): Bachelor of Science in Civil Engineering (with specializations in Structural Engineering and Construction Engineering Management); Bachelor of Science in Architecture; Bachelor of Science in Computer Science (with specializations in Digital Animation, Game Development, Web Development and Mobile Application); Bachelor of Science in Information Technology; Bachelor of Science in Computer Engineering; Bachelor of Library and Information Science.',
      'College of Criminology (CCrim): Bachelor of Science in Criminology.',
      'College of Education (CEd): Bachelor of Secondary Education majors in English, Filipino, Mathematics and Science; Bachelor of Technology and Livelihood Education majors in Information and Communications Technology and in Home Economics; Bachelor of Physical Education.',
      'A free BS Entrepreneurship scholarship for parents is offered through the FreEd community program (see Community Programs).',
    ].join('\n\n'),
    sourceUrl: `${SITE}/college-program/`,
    reviewNote: 'Taken from the website’s College Program page. BS Entrepreneurship appears on the FreEd page but not on this list. Confirm the list is current.',
  },
  {
    id: 'jpc-programs-preelem', category: 'programs', title: 'Pre-Elementary Program',
    keywords: ['pre-elementary', 'preschool', 'montessori', 'junior casa', 'senior casa', 'kindergarten'],
    content: 'The Pre-Elementary Program is a two-year program: Junior Casa for children ages 3 to 4 and Senior Casa for children ages 5 to 6. It uses the Montessori approach to build skills in practical life, basic reading and writing, socializing, and learning in the arts, music and sciences, preparing children for elementary school.',
    sourceUrl: `${SITE}/home/`, reviewNote: '',
  },
  {
    id: 'jpc-programs-elementary', category: 'programs', title: 'Elementary Program',
    keywords: ['elementary', 'grade 1', 'grade 6', 'montessori', 'k to 12', 'clubs', 'sports club', 'basketball', 'badminton', 'taekwondo', 'swimming', 'chess'],
    content: [
      'The Elementary Program covers Grade 1 to Grade 6. It uses the Montessori approach and follows the Department of Education curriculum, including the K to 12 program. The website describes a learner-centered curriculum and a child-friendly environment.',
      'Pupils can join academic clubs (English, Mathematics and Science) and a Sports Club with categories such as basketball, badminton, taekwondo, swimming and chess. The Head Teacher for Elementary listed on the website is Ms. Vacelisa V. Castillo.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/elementary-program/`, reviewNote: 'Confirm the head teacher’s name and title.',
  },
  {
    id: 'jpc-programs-jhs', category: 'programs', title: 'Junior High School',
    keywords: ['junior high school', 'jhs', 'grade 7', 'grade 10', 'special science class', 'robotics', 'journalism', 'basic research', 'science investigatory project'],
    content: [
      'Junior High School is four years (Grades 7 to 10) and follows the Department of Education curricula, including the K to 12 program and the Special Science and Technology curriculum. The website says the school aims to develop well-rounded students through academics, character building, camaraderie and sportsmanship.',
      'A Special Science Class runs from Grade 7 to Grade 10 with extra subjects: Robotics (Grade 10, where groups build and present a robot or machine); a Science Investigatory Project (started in Grade 7, aiming for a market-quality product by Grade 10); and Journalism (also open for training to regular-class students with potential).',
      'All Grade 10 students, in Special Science and regular classes, write a research paper with an adviser and present and defend it before panelists. This is required to move up to Senior High School. The Head Teacher for Junior High School listed on the website is Ms. Jerieca Lyka S. Rubio.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/secondary-program/`, reviewNote: 'Confirm the head teacher’s name and title.',
  },
  {
    id: 'jpc-programs-shs', category: 'programs', title: 'Senior High School strands',
    keywords: ['senior high school', 'shs', 'strand', 'abm', 'stem', 'humss', 'gas', 'tvl', 'tvl-ict', 'tvl-he', 'grade 11', 'grade 12'],
    content: [
      'Senior High School is two years (Grades 11 and 12) and offers these strands: ABM (Accountancy, Business and Management), STEM (Science, Technology, Engineering and Mathematics), HUMSS (Humanities and Social Sciences), GAS (General Academic Strand) and TVL (Technical Vocational Livelihood) with the ICT and Home Economics specializations.',
      'ABM prepares students for business-related degrees, covering financial management, accounting and corporate operations. STEM gives in-depth science and mathematics and builds critical thinking and problem solving through projects and research. HUMSS covers the humanities (philosophy, history, literature, religion, music) and the social sciences (such as criminology, law, political science and psychology).',
      'GAS takes a general approach to college preparation, with subjects such as Empowerment Technologies and Disaster Readiness and Risk Reduction, and lets students choose among many degree programs. TVL combines core subjects with hands-on courses assessed by TESDA competencies: TVL-ICT focuses on information technology and TVL-HE on home economics and service skills. The Head Teacher for Senior High School listed on the website is Mr. John Lester M. Florentino.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/secondary-program/`,
    reviewNote: 'The website’s strand list has copy-paste errors (several strands are labelled “Accountancy, Business and Management”). The expansions here come from the detailed descriptions below it. Confirm the strands offered this year.',
  },
  {
    id: 'jpc-admissions-requirements', category: 'admissions', title: 'Admission and enrollment requirements',
    keywords: ['admission', 'enroll', 'enrollment', 'requirements', 'form 138', 'report card', 'good moral', 'birth certificate', 'registration form', 'als'],
    content: [
      'Requirements listed on the website for college (undergraduate) applicants: Form 138 (Grade 12 report card or School Form 9) or an Alternative Learning System (ALS) Certificate of Rating; a Certificate of Good Moral Character; three 2×2 pictures; a photocopy of the NSO/PSA-authenticated birth certificate; and, if married, a photocopy of the NSO/PSA marriage certificate.',
      'For Senior High School and Junior High School: the report card; a Certificate of Good Moral Character; three 2×2 pictures; and a photocopy of the NSO/PSA-authenticated birth certificate.',
      'Registration forms for Junior High School, Elementary, College, Senior High School and the Tutorial and Review Center can be downloaded from the Admissions page. The website also links to an online Enrollment and Accounting portal. For questions, use the contact details of the admissions office.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/admissions/`,
    reviewNote: 'Requirements for pre-elementary and elementary are not listed on the website. Confirm them before publishing, and check the requirements are current.',
  },
  {
    id: 'jpc-contact', category: 'contact', title: 'Contact information and office hours',
    keywords: ['contact', 'phone', 'mobile', 'email', 'address', 'facebook', 'youtube', 'office hours', 'working hours'],
    content: [
      'Address: MG Andaya Compound, Odiong, Roxas, Oriental Mindoro. Phone: (043) 289 7197. Mobile: (0931) 958 8244 or (0916) 120 6753.',
      'Admissions email: admissions@johnpaulcollege.edu.ph. Registrar email: registrar@johnpaulcollege.edu.ph.',
      'Working hours: Monday to Friday, 8:00 AM to 5:00 PM; closed on Saturday and Sunday. The school is on Facebook (facebook.com/johnpaul.collegecorp) and YouTube (@1998OneJPC).',
    ].join('\n\n'),
    sourceUrl: `${SITE}/admissions/`, reviewNote: 'Confirm the phone numbers, emails and hours are current.',
  },
  {
    id: 'jpc-registrar', category: 'administration', title: 'Registrar’s Office',
    keywords: ['registrar', 'student records', 'enrollment', 'graduation', 'records'],
    content: 'The Office of the Registrar is the enrollment service unit that handles enrollment, student records, graduation, faculty attendance, government liaison and related services. Phone: (043) 289 7197. Email: registrar@johnpaulcollege.edu.ph. It is at the MG Andaya Compound, Odiong, Roxas, Oriental Mindoro.',
    sourceUrl: `${SITE}/registrar/`, reviewNote: '',
  },
  {
    id: 'jpc-leadership', category: 'administration', title: 'School leaders named on the website',
    keywords: ['president', 'vice president', 'academic affairs', 'head teacher', 'leadership', 'andaya', 'woo'],
    content: 'The website names Dr. Rosalina S. Andaya as President of John Paul College and Dr. Ramon E. Woo, Jr. as Vice President for Academic Affairs. It lists these Head Teachers: Ms. Vacelisa V. Castillo (Elementary), Ms. Jerieca Lyka S. Rubio (Junior High School) and Mr. John Lester M. Florentino (Senior High School).',
    sourceUrl: `${SITE}/fre/`,
    reviewNote: 'Positions change. Confirm every name and title before publishing. No board of directors page was found on the website.',
  },
  {
    id: 'jpc-community-freed', category: 'community', title: 'FreEd: Free Education for Parents',
    keywords: ['freed', 'free education', 'parents', 'entrepreneurship', 'scholarship', 'community extension', 'indigenous', 'unifast'],
    content: [
      'FreEd from Illiteracy (Free Education for Parents) is a community extension program of John Paul College in Roxas. It gives selected parents who never finished a college degree, including members of indigenous communities and workers without a bachelor’s degree, a four-year full scholarship in the BS Entrepreneurship program. The school covers costs such as tuition, miscellaneous fees and printed modules, and the program was initiated by the President, Dr. Rosalina S. Andaya.',
      'Applicants are chosen by the scholarship office, the Office of the Vice President for Academic Affairs and the Registrar based on their submitted documents, and the school works with the local government of Roxas. Scholars also take TESDA food preparation skills training, and may apply for UniFAST and other scholarships if they meet the residency requirement. After graduating, they are referred to the LGU, government agencies and private employers, and the registrar tracks their employment.',
      'The website reports more than 500 parents enrolled and expects the first graduates by Academic Year 2025-2026.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/fre/`,
    reviewNote: 'The website gives different numbers (500 and 555 enrolled) and different start years (2021 and 2022). Confirm the figures.',
  },
  {
    id: 'jpc-community-hope', category: 'community', title: 'Project HOPE (charity program)',
    keywords: ['project hope', 'hope', 'dangkalan', 'bulalacao', 'charity', 'outreach', 'scholarship', 'medical', 'dental'],
    content: [
      'Project HOPE (Holistic Opportunities for Progress and Empowerment) is John Paul College’s charity program for the community of Sitio Dangkalan, Barangay San Roque, Bulalacao, Oriental Mindoro. It began in December 2020 as the President’s yearly Christmas gift-giving to the community and grew into a broader program on education and skills, health and wellness, economic empowerment and community development.',
      'The website lists support such as new classrooms, books, computers and learning materials for Dangkalan Elementary School; scholarships; training for teachers; medical and dental check-ups, blood pressure and glucose tests, haircuts and circumcision for boys; first aid and other skills trainings; and links with industry for future employment. It serves 256 pupils and their families, and plans a community learning center.',
    ].join('\n\n'),
    sourceUrl: `${SITE}/project-hope/`, reviewNote: 'Confirm the figures and the start date.',
  },
  {
    id: 'jpc-community-myc', category: 'community', title: 'EmpowerEd MYClassroom',
    keywords: ['empowered myclassroom', 'myclassroom', 'youth center', 'bansud', 'youth detainees', 'rehabilitation'],
    content: 'EmpowerEd MYClassroom is an educational initiative launched by the John Paul College Executive Council in 2020 to 2021 for young detainees at the MIMAROPA Youth Center in Bansud, Oriental Mindoro, after the COVID-19 pandemic disrupted their schooling. It offers formal education suited to their levels, life-skills workshops (financial literacy, communication, conflict resolution), counseling and peer support, sports and health education, community outreach, and links to partners for jobs, further study or entrepreneurship, with teachers tracking progress. It supports rehabilitation and reintegration under the juvenile justice law (RA 9344).',
    sourceUrl: `${SITE}/empowered-myclassroom/`,
    reviewNote: 'The source page also contains teacher feedback about individual youth. That was deliberately NOT included here, for their privacy. Placeholder text on that page was ignored.',
  },
  {
    id: 'jpc-glance', category: 'background', title: 'John Paul College at a glance',
    keywords: ['at a glance', 'enrollment', 'staff', 'clubs', 'ptfa', 'blue phoenix', 'athletes', 'tagline'],
    content: 'As stated on its website, John Paul College has more than 4,000 current enrollments, more than 200 qualified staff, more than 80 clubs and activities, and more than 500 active PTFA members. Its tagline is “We Nurture. We Empower. We Inspire.” The school’s athletes are known as the Blue Phoenix.',
    sourceUrl: `${SITE}/home/`,
    reviewNote: 'These figures are promotional and change. “Blue Phoenix” comes from a sports post on the OSA page. Confirm both.',
  },
];
