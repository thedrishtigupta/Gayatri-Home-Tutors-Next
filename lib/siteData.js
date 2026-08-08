// lib/siteData.js — single source of truth for SEO landing pages, FAQs and NAP.
// Content lives here (not duplicated inside 23 page files) so copy stays unique,
// editable and consistent, while each route still renders a real static page.

export const SITE = {
  name: "Gayatri Home Tutors",
  legalName: "Gayatri Home Tutors",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://gayatrihometutors.com",
  phone: process.env.NEXT_PUBLIC_PHONE || "+918505952700",
  phoneDisplay: "+91 85059 52700",
  email: "gayatrihometutor@gmail.com",
  street: "Ranibagh",
  locality: "Delhi",
  region: "DL",
  postalCode: "110034",
  country: "IN",
  founded: "2010",
  openingHours: "Mo-Sa 09:00-20:00",
  priceRange: "₹₹",
  logo: "/assets/images/GHTLogo.svg",
  ogImage: "/assets/images/img1.webp",
};

export const CORE_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "Social Science",
  "Computer Science",
  "Accountancy",
  "Economics",
  "Business Studies",
  "Sanskrit",
];

/* ─────────────────────────────────────────────────────────────
   Local SEO — one entry per Delhi NCR locality landing page.
   Each entry carries genuinely different copy (landmarks, local
   context, FAQs) so no two pages are duplicate content.
   ───────────────────────────────────────────────────────────── */
export const AREA_PAGES = [
  {
    slug: "home-tutor-delhi",
    area: "Delhi",
    title: "Home Tutor in Delhi — Verified Home Tuition for Class 1–12",
    description:
      "Hire a verified home tutor in Delhi for Class 1–12, CBSE, ICSE, JEE and NEET. Free demo class, background-checked tutors, flexible timings. Call +91 85059 52700.",
    h1: "Home Tutor in Delhi",
    intro:
      "Gayatri Home Tutors has been placing tutors in Delhi homes since 2010. Whether your child studies in a South Delhi private school, a North Delhi Kendriya Vidyalaya or a Delhi Government school, we match you with a tutor who already teaches that board, that class and that syllabus — and who lives close enough to reach you on time every single day.",
    localContext:
      "We cover all eleven districts of Delhi, from Rohini and Pitampura in the north-west to Laxmi Nagar and Mayur Vihar across the Yamuna. Tutors are shortlisted by travel distance first, so a 6 pm slot actually starts at 6 pm.",
    landmarks: ["Rohini", "Pitampura", "Model Town", "Janakpuri", "Dwarka", "Paschim Vihar", "Laxmi Nagar", "Ashok Vihar"],
    boards: ["CBSE", "ICSE", "IB", "Delhi State Board"],
    faqs: [
      { q: "How quickly can I get a home tutor in Delhi?", a: "For most Delhi localities we share tutor profiles within 24 hours and arrange a free demo class within 48 hours." },
      { q: "Do you charge parents a registration fee?", a: "No. Parents pay only the monthly tuition fee agreed with the tutor after the free demo class." },
      { q: "Are the tutors verified?", a: "Every tutor submits ID proof and qualification documents, and we verify them before any home visit is scheduled." },
    ],
  },
  {
    slug: "home-tuition-delhi",
    area: "Delhi",
    title: "Home Tuition in Delhi — Affordable One-on-One Classes at Home",
    description:
      "Affordable home tuition in Delhi for all subjects and boards. One-on-one teaching at your home, progress reports, and a free demo class before you pay anything.",
    h1: "Home Tuition in Delhi",
    intro:
      "Home tuition works when it is consistent, personal and measurable. Our Delhi programme gives your child one tutor, a written study plan for the term, and a monthly progress note you can actually read — instead of the crowded coaching batch where doubts go unasked.",
    localContext:
      "Classes run at your home, at times that fit school, sports and board-exam schedules. Weekend-only and alternate-day plans are available across Delhi, and online sessions can cover exam weeks or monsoon disruptions.",
    landmarks: ["North Delhi", "West Delhi", "South Delhi", "East Delhi", "Central Delhi"],
    boards: ["CBSE", "ICSE", "NIOS"],
    faqs: [
      { q: "What does home tuition in Delhi cost?", a: "Fees depend on class, subject count and tutor experience. Primary classes typically start lower than senior-secondary science, and we confirm the exact monthly fee before the demo." },
      { q: "Can we change the tutor if it isn't the right fit?", a: "Yes. Tell us after any class and we arrange a replacement demo at no extra cost." },
      { q: "Do you offer two-student or sibling batches?", a: "Yes, siblings or two neighbouring students of the same class can share a slot at a reduced per-student fee." },
    ],
  },
  {
    slug: "home-tutor-rohini",
    area: "Rohini",
    title: "Home Tutor in Rohini — Sector-wise Tutors for Class 1–12",
    description:
      "Home tutors in Rohini across all sectors, for Maths, Science, English and board exams. Verified tutors nearby, free demo class, flexible evening batches.",
    h1: "Home Tutor in Rohini",
    intro:
      "Rohini is one of our strongest tutor networks — we place tutors sector by sector, from Sector 3 near Rithala to Sector 24 on the Rohini–Bawana road. Because tutors are matched inside your own sector, travel time stops eating into the lesson.",
    localContext:
      "Most Rohini families we work with study in CBSE schools, so tutors follow the NCERT sequence and school worksheets rather than an unrelated coaching module. Sector 8, 11, 13 and 16 have the highest tutor availability for senior classes.",
    landmarks: ["Rohini Sector 3", "Rohini Sector 7", "Rohini Sector 8", "Rohini Sector 11", "Rohini Sector 13", "Rohini Sector 16", "Rithala", "Rohini West Metro"],
    boards: ["CBSE", "ICSE"],
    faqs: [
      { q: "Which Rohini sectors do you cover?", a: "All sectors from 1 to 24, plus Rithala, Budh Vihar and Avantika. Tell us your sector and we shortlist tutors living within a few kilometres." },
      { q: "Do you have Maths and Science tutors for Class 10 in Rohini?", a: "Yes — Class 9 and 10 Maths and Science are the most requested Rohini subjects and we keep a dedicated panel for them." },
      { q: "Are female home tutors available in Rohini?", a: "Yes, female tutors are available for all classes and can be requested at the time of enquiry." },
    ],
  },
  {
    slug: "home-tutor-pitampura",
    area: "Pitampura",
    title: "Home Tutor in Pitampura — Experienced Tutors for CBSE & ICSE",
    description:
      "Find an experienced home tutor in Pitampura for Class 1–12. CBSE and ICSE specialists, board-exam preparation, and a free demo class before you commit.",
    h1: "Home Tutor in Pitampura",
    intro:
      "Pitampura families usually come to us for board results — Class 10 and 12 revision, sample-paper practice and time-bound writing drills. Our Pitampura panel is weighted towards tutors with five or more years of board-exam teaching.",
    localContext:
      "We serve Kohat Enclave, Saraswati Vihar, Rani Bagh, Deepali and the NSP side of Pitampura. Our own office in Ranibagh is minutes away, so tutor replacement here is usually same-week.",
    landmarks: ["Kohat Enclave", "Saraswati Vihar", "Rani Bagh", "Deepali Chowk", "Netaji Subhash Place", "Madhuban Chowk"],
    boards: ["CBSE", "ICSE"],
    faqs: [
      { q: "Do you provide board-exam crash revision in Pitampura?", a: "Yes, we run focused pre-board revision plans from December to February with weekly timed paper practice." },
      { q: "Can a tutor teach two subjects in one visit?", a: "Yes. Many Pitampura students take a combined Maths + Science slot of 90 minutes." },
      { q: "How close is your office?", a: "Our office is in Ranibagh, Delhi-110034 — a short drive from Madhuban Chowk." },
    ],
  },
  {
    slug: "home-tutor-janakpuri",
    area: "Janakpuri",
    title: "Home Tutor in Janakpuri — Block-wise Home Tuition in West Delhi",
    description:
      "Home tutors in Janakpuri for all classes and subjects. Block-wise tutor matching in West Delhi, verified profiles, free demo class, evening and weekend slots.",
    h1: "Home Tutor in Janakpuri",
    intro:
      "Janakpuri's block layout makes tutor matching precise: we shortlist tutors by block letter, so A-block families are not waiting on a tutor coming from C-block through District Centre traffic.",
    localContext:
      "Alongside school tuition, Janakpuri sees strong demand for Class 11–12 Commerce — Accountancy, Business Studies and Economics — and we maintain a separate Commerce panel for West Delhi.",
    landmarks: ["Janakpuri A Block", "Janakpuri B Block", "Janakpuri C Block", "Janakpuri District Centre", "Tilak Nagar", "Vikaspuri", "Uttam Nagar"],
    boards: ["CBSE", "ICSE"],
    faqs: [
      { q: "Do you have Commerce tutors in Janakpuri?", a: "Yes — Accountancy, Business Studies and Economics tutors for Class 11 and 12 are available across Janakpuri and Vikaspuri." },
      { q: "Can classes start after 7 pm?", a: "Yes, late-evening slots up to 8:30 pm are commonly available in West Delhi." },
      { q: "Do you cover Uttam Nagar and Vikaspuri too?", a: "Yes, both are part of the same West Delhi tutor cluster." },
    ],
  },
  {
    slug: "home-tutor-dwarka",
    area: "Dwarka",
    title: "Home Tutor in Dwarka — Sector-wise Tutors for Class 1–12 & JEE/NEET",
    description:
      "Hire a home tutor in Dwarka, sector by sector. School tuition, JEE and NEET foundation, CBSE and ICSE support. Verified tutors and a free demo class.",
    h1: "Home Tutor in Dwarka",
    intro:
      "Dwarka is a large, sector-based sub-city, so distance matters more here than anywhere else in Delhi. We match tutors within your sector or an adjacent one and confirm travel feasibility before the demo is booked.",
    localContext:
      "Demand in Dwarka skews towards competitive-exam foundation — JEE and NEET preparation alongside school syllabus for Class 9 to 12 — so a large share of our Dwarka tutors are engineering and medical graduates.",
    landmarks: ["Dwarka Sector 6", "Dwarka Sector 7", "Dwarka Sector 10", "Dwarka Sector 12", "Dwarka Sector 19", "Dwarka Sector 23", "Dwarka Mor", "Palam"],
    boards: ["CBSE", "ICSE", "IB"],
    faqs: [
      { q: "Do you provide JEE and NEET home tutors in Dwarka?", a: "Yes, we have subject-wise JEE and NEET tutors who work alongside your child's school syllabus." },
      { q: "Which Dwarka sectors are covered?", a: "Sectors 1 to 23, plus Dwarka Mor, Palam and Bindapur." },
      { q: "Can two subjects be taught on alternate days?", a: "Yes, alternate-day subject rotation is a common Dwarka schedule." },
    ],
  },
  {
    slug: "home-tutor-model-town",
    area: "Model Town",
    title: "Home Tutor in Model Town — North Delhi Home Tuition",
    description:
      "Home tuition in Model Town, North Delhi. Verified tutors for Class 1–12, all subjects and boards, with a free demo class and monthly progress updates.",
    h1: "Home Tutor in Model Town",
    intro:
      "Model Town families often ask for tutors who can hold a long-term engagement — the same tutor from Class 8 through Class 10 — and our North Delhi panel is built around retention rather than one-term placements.",
    localContext:
      "We cover Model Town I, II and III, along with Adarsh Nagar, Azadpur and GTB Nagar. Proximity to Delhi University means many of our tutors here are postgraduate students and research scholars.",
    landmarks: ["Model Town I", "Model Town II", "Model Town III", "Adarsh Nagar", "Azadpur", "GTB Nagar", "Kingsway Camp"],
    boards: ["CBSE", "ICSE"],
    faqs: [
      { q: "Are Delhi University tutors available in Model Town?", a: "Yes, many tutors on our North Delhi panel are DU postgraduates or research scholars." },
      { q: "Do you teach Sanskrit and Hindi?", a: "Yes, language subjects including Hindi and Sanskrit are covered for all classes." },
      { q: "Is a trial class really free?", a: "Yes, the first demo class is free and there is no obligation to continue." },
    ],
  },
  {
    slug: "home-tutor-paschim-vihar",
    area: "Paschim Vihar",
    title: "Home Tutor in Paschim Vihar — Verified West Delhi Tutors",
    description:
      "Home tutors in Paschim Vihar for Class 1–12 across CBSE and ICSE. Block-wise matching, verified profiles, free demo class and flexible timings.",
    h1: "Home Tutor in Paschim Vihar",
    intro:
      "Paschim Vihar has a dense cluster of CBSE schools, and our tutors here work directly from school worksheets and unit-test patterns rather than a generic syllabus outline.",
    localContext:
      "Coverage runs across A to G blocks, plus Peeragarhi, Punjabi Bagh and Madipur. Evening slots between 5 pm and 8 pm fill up fastest during exam season, so early booking helps.",
    landmarks: ["Paschim Vihar A Block", "Paschim Vihar B Block", "Peeragarhi", "Punjabi Bagh", "Madipur", "Meera Bagh"],
    boards: ["CBSE", "ICSE"],
    faqs: [
      { q: "Can I get a tutor for just one subject?", a: "Yes, single-subject tuition is common — Maths and Science are the most requested here." },
      { q: "Do tutors help with school projects and assignments?", a: "Tutors guide project work but the student does the work; we do not complete assignments on a student's behalf." },
      { q: "What if we go out of station for a few weeks?", a: "Classes can be paused or moved online; fees are adjusted for the missed period." },
    ],
  },
  {
    slug: "home-tutor-ashok-vihar",
    area: "Ashok Vihar",
    title: "Home Tutor in Ashok Vihar — Phase-wise Home Tuition",
    description:
      "Home tutor in Ashok Vihar for all classes and subjects. Phase-wise tutor matching, verified and experienced teachers, free demo class before you decide.",
    h1: "Home Tutor in Ashok Vihar",
    intro:
      "Ashok Vihar sits close to our Ranibagh office, which makes it one of our fastest-response localities — tutor shortlists usually go out the same day an enquiry comes in.",
    localContext:
      "We serve Phase I to Phase IV, along with Wazirpur, Shalimar Bagh and Keshav Puram. Primary-class tutors here are chosen for patience and phonics-first reading practice.",
    landmarks: ["Ashok Vihar Phase I", "Ashok Vihar Phase II", "Ashok Vihar Phase III", "Wazirpur", "Shalimar Bagh", "Keshav Puram"],
    boards: ["CBSE", "ICSE"],
    faqs: [
      { q: "Do you have tutors for Class 1 to 5?", a: "Yes, primary tutors focus on reading fluency, handwriting, number sense and homework routine." },
      { q: "How many classes per week are recommended?", a: "Three to four sessions a week works for most students; board-exam classes often move to five." },
      { q: "Can I meet the tutor before classes begin?", a: "Yes — the free demo class is exactly that meeting." },
    ],
  },
  {
    slug: "home-tutor-laxmi-nagar",
    area: "Laxmi Nagar",
    title: "Home Tutor in Laxmi Nagar — East Delhi Home Tuition",
    description:
      "Home tutors in Laxmi Nagar and East Delhi for school, board and competitive exams. Verified tutors, affordable fees, free demo class. Call +91 85059 52700.",
    h1: "Home Tutor in Laxmi Nagar",
    intro:
      "Laxmi Nagar is East Delhi's education hub, and parents here often want an alternative to the crowded coaching centres on Vikas Marg. One-to-one home tuition gives the same syllabus coverage with full attention on your child.",
    localContext:
      "We cover Laxmi Nagar, Shakarpur, Preet Vihar, Nirman Vihar and Mayur Vihar. Commerce and Economics tutors are especially strong in this cluster.",
    landmarks: ["Shakarpur", "Preet Vihar", "Nirman Vihar", "Mayur Vihar", "Vikas Marg", "Krishna Nagar"],
    boards: ["CBSE", "ICSE", "NIOS"],
    faqs: [
      { q: "Do you cover Mayur Vihar and Preet Vihar?", a: "Yes, the whole East Delhi corridor along Vikas Marg is covered." },
      { q: "Are NIOS students accepted?", a: "Yes, we have tutors experienced with the NIOS syllabus and assignment format." },
      { q: "Is online tuition available if traffic is a problem?", a: "Yes, hybrid plans mixing home visits and online classes are available." },
    ],
  },
  {
    slug: "home-tutor-noida",
    area: "Noida",
    title: "Home Tutor in Noida — Sector-wise Tutors for CBSE, ICSE & IB",
    description:
      "Home tutors in Noida across all sectors for CBSE, ICSE and IB students. School tuition, JEE and NEET foundation, verified tutors and a free demo class.",
    h1: "Home Tutor in Noida",
    intro:
      "Noida households often need a tutor who can handle both an international-style curriculum and Indian board rigour. Our Noida panel includes IB and IGCSE-experienced tutors alongside CBSE specialists.",
    localContext:
      "Coverage spans Sector 15 to Sector 137 and the Noida Extension belt. Because sector distances are large, we confirm the tutor's commute before booking a fixed daily slot.",
    landmarks: ["Noida Sector 15", "Sector 44", "Sector 50", "Sector 62", "Sector 76", "Sector 137", "Noida Extension"],
    boards: ["CBSE", "ICSE", "IB", "IGCSE"],
    faqs: [
      { q: "Do you have IB and IGCSE tutors in Noida?", a: "Yes, we maintain a smaller specialist panel for IB and IGCSE — please mention the curriculum when you enquire." },
      { q: "Which Noida sectors do you serve?", a: "All main sectors plus Noida Extension and Greater Noida West on request." },
      { q: "Can classes be scheduled on weekends only?", a: "Yes, weekend-intensive plans are popular with working parents in Noida." },
    ],
  },
  {
    slug: "home-tutor-gurgaon",
    area: "Gurgaon",
    title: "Home Tutor in Gurgaon — Home Tuition Across Gurugram Sectors",
    description:
      "Verified home tutors in Gurgaon (Gurugram) for Class 1–12, CBSE, ICSE and IB. Condominium-friendly scheduling, free demo class, and progress tracking.",
    h1: "Home Tutor in Gurgaon",
    intro:
      "In Gurgaon most of our placements are inside gated condominiums, so tutors are briefed on society entry rules and arrive with ID for gate registration — a small detail that saves parents a call every single day.",
    localContext:
      "We cover Old Gurgaon, DLF Phases 1–5, Sohna Road, Golf Course Road and the New Gurgaon sectors. IB, IGCSE and CBSE are all supported.",
    landmarks: ["DLF Phase 1", "DLF Phase 3", "Golf Course Road", "Sohna Road", "Sector 56", "South City", "Palam Vihar"],
    boards: ["CBSE", "ICSE", "IB", "IGCSE"],
    faqs: [
      { q: "Do tutors come inside gated societies?", a: "Yes. Tutors carry photo ID and we share their details in advance for gate approval." },
      { q: "Is spoken English coaching available?", a: "Yes, spoken English and communication classes are offered for both students and adults." },
      { q: "How far in advance should I book?", a: "One week's notice is ideal; urgent placements are often possible within 48 hours." },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   Content SEO — class-, board- and format-specific landing pages.
   ───────────────────────────────────────────────────────────── */
export const TOPIC_PAGES = [
  {
    slug: "home-tuition-class-1-5",
    title: "Home Tuition for Class 1 to 5 — Primary Home Tutors in Delhi NCR",
    description:
      "Patient, primary-trained home tutors for Class 1 to 5 in Delhi NCR. Reading fluency, handwriting, number sense and a steady homework routine. Free demo class.",
    h1: "Home Tuition for Class 1 to 5",
    intro:
      "Primary tuition is not about finishing the textbook faster. It is about building reading fluency, clean handwriting, number sense and the habit of sitting down to work without a fight. Our primary tutors are chosen for patience first and qualifications second.",
    highlights: [
      "Phonics-based reading and comprehension practice",
      "Handwriting and spelling drills built into every session",
      "Tables, mental maths and number-sense games",
      "Daily homework routine parents can actually maintain",
      "Short 45–60 minute sessions matched to a young attention span",
    ],
    subjects: ["English", "Hindi", "Mathematics", "Environmental Studies", "General Knowledge"],
    faqs: [
      { q: "How long should a Class 1–5 tuition session be?", a: "Forty-five to sixty minutes is ideal. Younger children lose focus beyond that, so we keep sessions short and frequent." },
      { q: "Will the tutor help with school homework?", a: "Yes, homework support is part of the session, alongside concept practice." },
      { q: "Should a parent sit in the class?", a: "For the first few sessions it helps. After that, most children work better independently with the tutor." },
    ],
  },
  {
    slug: "home-tuition-class-6-8",
    title: "Home Tuition for Class 6 to 8 — Middle School Tutors in Delhi NCR",
    description:
      "Middle-school home tutors for Class 6, 7 and 8 in Delhi NCR. Strengthen Maths and Science fundamentals before board classes. Verified tutors, free demo class.",
    h1: "Home Tuition for Class 6 to 8",
    intro:
      "Class 6 to 8 is where marks quietly slip. The syllabus jumps to algebra, chemical reactions and analytical writing, and gaps left here become Class 10 problems. Middle-school tuition is the cheapest insurance a parent can buy.",
    highlights: [
      "Algebra, geometry and fraction fundamentals rebuilt from the base",
      "Science taught with observation and reasoning, not memorisation",
      "Answer-writing structure for Social Science and English",
      "Regular unit-test style practice matched to school papers",
      "Olympiad and NTSE foundation available on request",
    ],
    subjects: ["Mathematics", "Science", "English", "Hindi", "Social Science", "Sanskrit", "Computer Science"],
    faqs: [
      { q: "My child scores well but forgets concepts. Can tuition help?", a: "Yes — spaced revision and cumulative testing are built into our middle-school plans specifically for this problem." },
      { q: "Do you prepare students for Olympiads?", a: "Yes, Maths and Science Olympiad foundation can be added to regular tuition." },
      { q: "How many subjects should we start with?", a: "Usually Maths and Science first; languages can be added if answer writing needs work." },
    ],
  },
  {
    slug: "home-tuition-class-9-10",
    title: "Home Tuition for Class 9 & 10 — Board Exam Tutors in Delhi NCR",
    description:
      "Class 9 and 10 home tuition in Delhi NCR with board-exam specialists. NCERT mastery, sample papers, timed practice and monthly progress reports. Free demo.",
    h1: "Home Tuition for Class 9 and 10",
    intro:
      "Class 10 is the first board year, and it rewards method over cramming. Our Class 9–10 tutors work through NCERT line by line, then move to previous-year papers and timed writing so the exam hall holds no surprises.",
    highlights: [
      "Complete NCERT coverage with exemplar problems",
      "Chapter-wise tests followed by full-length sample papers",
      "Timed writing practice to fix pacing and presentation",
      "Separate Maths (Standard and Basic) tracks",
      "Pre-board revision plan from December onwards",
    ],
    subjects: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Information Technology"],
    faqs: [
      { q: "Should we choose Standard or Basic Maths?", a: "Choose Standard if the student may take Maths in Class 11. Our tutor will advise after assessing the first month's work." },
      { q: "When should Class 10 tuition start?", a: "April or May of Class 10 is ideal. Starting in December limits the work to revision only." },
      { q: "Do you provide sample papers?", a: "Yes, chapter tests and full CBSE-pattern sample papers are included." },
    ],
  },
  {
    slug: "home-tuition-class-11-12",
    title: "Home Tuition for Class 11 & 12 — Senior Secondary Tutors in Delhi NCR",
    description:
      "Class 11 and 12 home tutors in Delhi NCR for Science, Commerce and Humanities. Board plus JEE/NEET alignment, subject specialists, free demo class.",
    h1: "Home Tuition for Class 11 and 12",
    intro:
      "Senior secondary needs subject specialists, not generalists. A Class 12 Physics tutor and a Class 12 Accountancy tutor are two different hires, and we staff them separately so depth never gets diluted.",
    highlights: [
      "Separate specialists for Physics, Chemistry, Maths, Biology and Commerce",
      "Board syllabus aligned with JEE or NEET where required",
      "Numerical and derivation drills for Physics and Chemistry",
      "Full accounting cycle practice for Commerce students",
      "Pre-board and board revision schedules with timed papers",
    ],
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "Accountancy", "Business Studies", "Economics", "English", "Computer Science", "Political Science"],
    faqs: [
      { q: "Can one tutor teach all of PCM?", a: "We usually recommend at least two tutors — one for Maths and one for Physics/Chemistry — for genuine subject depth." },
      { q: "Do you cover practical and viva preparation?", a: "Yes, practical file work and viva questions are covered close to the practical exam." },
      { q: "Is Commerce coaching available at home?", a: "Yes, Accountancy, Business Studies and Economics tutors are available across Delhi NCR." },
    ],
  },
  {
    slug: "home-tutor-cbse",
    title: "CBSE Home Tutor in Delhi NCR — NCERT-Focused Tuition",
    description:
      "CBSE home tutors in Delhi NCR for Class 1–12. NCERT-first teaching, CBSE sample papers, competency-based questions and board-pattern practice. Free demo.",
    h1: "CBSE Home Tutor in Delhi NCR",
    intro:
      "CBSE rewards students who know NCERT cold and can handle competency-based questions. Our CBSE tutors teach the textbook first, then layer on case-study and assertion-reason practice in the exact board format.",
    highlights: [
      "NCERT and NCERT Exemplar as the primary source",
      "Competency-based, case-study and assertion-reason question practice",
      "CBSE marking-scheme-aware answer writing",
      "Internal assessment and project guidance",
      "Previous ten years' board papers for Class 10 and 12",
    ],
    subjects: CORE_SUBJECTS,
    faqs: [
      { q: "Do tutors follow the school's worksheets?", a: "Yes. Tutors align with your school's pacing and worksheets while keeping NCERT as the base." },
      { q: "What is the CBSE marking scheme approach?", a: "Answers are practised in step-marked form so no marks are lost on presentation." },
      { q: "Is CBSE tuition available online?", a: "Yes, both home visits and online classes are available." },
    ],
  },
  {
    slug: "home-tutor-icse",
    title: "ICSE Home Tutor in Delhi NCR — ICSE & ISC Tuition at Home",
    description:
      "ICSE and ISC home tutors in Delhi NCR. Detailed answer writing, literature depth and practical-heavy Science teaching for Class 1–12. Book a free demo class.",
    h1: "ICSE Home Tutor in Delhi NCR",
    intro:
      "ICSE demands longer, more detailed answers and far deeper English literature work than CBSE. Our ICSE tutors are hired specifically for that board — they know the Selina and Frank texts, and they know how ICSE examiners award marks.",
    highlights: [
      "Selina, Frank and Concise reference work alongside school texts",
      "Literature analysis for Treasure Trove poems and stories",
      "Detailed, point-wise answer structure for Science and History",
      "Practical and project component guidance",
      "ISC-level Physics, Chemistry, Maths and Commerce specialists",
    ],
    subjects: ["English Language", "English Literature", "Mathematics", "Physics", "Chemistry", "Biology", "History & Civics", "Geography", "Computer Applications"],
    faqs: [
      { q: "Is ICSE harder than CBSE?", a: "It is more detail-heavy in languages and practicals. The workload differs more than the difficulty." },
      { q: "Do you have ISC tutors for Class 11 and 12?", a: "Yes, ISC subject specialists are available across Delhi NCR." },
      { q: "Which reference books do tutors use?", a: "Mostly Selina, Frank and Concise, alongside the school's prescribed texts." },
    ],
  },
  {
    slug: "home-tutor-jee",
    title: "JEE Home Tutor in Delhi NCR — One-on-One JEE Main & Advanced Coaching",
    description:
      "JEE home tutors in Delhi NCR for Main and Advanced. Subject-wise IIT and NIT graduates, problem-solving drills, mock-test analysis. Free demo class.",
    h1: "JEE Home Tutor in Delhi NCR",
    intro:
      "Coaching classes move at the pace of the median student. A JEE home tutor moves at yours — closing the specific chapters where your mock scores collapse instead of re-teaching what you already solve correctly.",
    highlights: [
      "Subject-wise tutors for Physics, Chemistry and Mathematics",
      "Concept building followed by graded problem sets",
      "Mock-test analysis: error type, time per question, chapter weakness",
      "Board syllabus kept in sync so Class 12 marks do not suffer",
      "Advanced-level problem practice for repeat and drop-year aspirants",
    ],
    subjects: ["Physics", "Chemistry", "Mathematics"],
    faqs: [
      { q: "Can home tuition replace coaching for JEE?", a: "For many students yes, and for others it works best as a supplement that fixes weak chapters. We will be honest about which you need." },
      { q: "Do you support drop-year aspirants?", a: "Yes, full-day structured plans are available for repeat aspirants." },
      { q: "Which tutors teach JEE?", a: "Engineering graduates and postgraduates with proven JEE teaching experience, verified before placement." },
    ],
  },
  {
    slug: "home-tutor-neet",
    title: "NEET Home Tutor in Delhi NCR — Biology, Physics & Chemistry at Home",
    description:
      "NEET home tutors in Delhi NCR. NCERT Biology mastery, Physics numericals, Chemistry revision and full mock-test analysis. Verified tutors, free demo class.",
    h1: "NEET Home Tutor in Delhi NCR",
    intro:
      "NEET is won on NCERT Biology accuracy and Physics numericals. Our NEET tutors drill line-level NCERT recall for Biology while separately fixing the Physics chapters that cost most aspirants their rank.",
    highlights: [
      "Line-by-line NCERT Biology with recall testing",
      "Physics numericals taught from first principles",
      "Organic and Inorganic Chemistry revision cycles",
      "Weekly MCQ practice with negative-marking discipline",
      "Full-length mock analysis and time management",
    ],
    subjects: ["Biology", "Physics", "Chemistry"],
    faqs: [
      { q: "Is NCERT enough for NEET Biology?", a: "For Biology, NCERT plus rigorous recall testing covers the vast majority of questions. Physics and Chemistry need additional problem practice." },
      { q: "Do you teach NEET alongside Class 12 boards?", a: "Yes, the plan is built so board preparation and NEET preparation reinforce each other." },
      { q: "Are medical graduates available as tutors?", a: "Yes, several NEET tutors on our panel are medical students or graduates." },
    ],
  },
  {
    slug: "female-home-tutor",
    title: "Female Home Tutor in Delhi NCR — Verified Lady Tutors for Home Tuition",
    description:
      "Book a verified female home tutor in Delhi NCR for Class 1–12 and all subjects. ID-verified lady tutors, comfortable learning environment, free demo class.",
    h1: "Female Home Tutor in Delhi NCR",
    intro:
      "Many families specifically prefer a female tutor — for young children, for girl students, or simply for comfort at home. We keep a large verified panel of lady tutors across every Delhi NCR locality we serve.",
    highlights: [
      "ID and qualification verified before any home visit",
      "Available for all classes from Class 1 to Class 12",
      "Preferred choice for primary classes and girl students",
      "Daytime and early-evening slots widely available",
      "Same free demo class and replacement policy as all placements",
    ],
    subjects: CORE_SUBJECTS,
    faqs: [
      { q: "How do I request a female tutor?", a: "Mention it when you enquire or book a demo — we will only send female tutor profiles." },
      { q: "Are female tutors available for senior science subjects?", a: "Yes, including Class 11–12 Physics, Chemistry, Maths and Biology." },
      { q: "What verification is done?", a: "Photo ID, address proof and qualification documents are checked before placement." },
    ],
  },
  {
    slug: "online-tuition",
    title: "Online Tuition in Delhi NCR & Across India — Live One-on-One Classes",
    description:
      "Live one-on-one online tuition for Class 1–12, CBSE, ICSE, JEE and NEET. Shared whiteboard, recorded notes, flexible timings. Book a free online demo class.",
    h1: "Online Tuition — Live One-on-One Classes",
    intro:
      "Online tuition removes travel from the equation, which means a wider tutor choice and slots that fit around school, coaching and family schedules. Classes are live and one-on-one — never a recorded video library.",
    highlights: [
      "Live one-on-one sessions with a shared digital whiteboard",
      "Notes and worked solutions shared after every class",
      "Access to specialist tutors regardless of your locality",
      "Ideal for exam weeks, travel and out-of-Delhi students",
      "Same tutor every session for continuity",
    ],
    subjects: CORE_SUBJECTS,
    faqs: [
      { q: "What do we need for online tuition?", a: "A laptop or tablet, a stable internet connection and a quiet corner. A stylus helps but is not required." },
      { q: "Are classes recorded?", a: "Sessions are live; written notes and solved problems are shared afterwards." },
      { q: "Can we switch between online and home classes?", a: "Yes, hybrid plans are common — home visits on weekdays and online during travel or exam weeks." },
    ],
  },
  {
    slug: "offline-tuition",
    title: "Offline Home Tuition in Delhi NCR — Face-to-Face Classes at Home",
    description:
      "Traditional offline home tuition across Delhi NCR. A verified tutor at your home, fixed daily slots, written practice and monthly progress updates. Free demo.",
    h1: "Offline Home Tuition at Your Home",
    intro:
      "For many students nothing replaces a tutor sitting at the same table — pen on paper, immediate correction, no screen to drift away from. Offline home tuition remains our most requested format, and our largest tutor panel.",
    highlights: [
      "Verified tutor travels to your home at a fixed daily slot",
      "Pen-and-paper practice with instant correction",
      "No screen fatigue — important for younger students",
      "Direct parent–tutor conversation after class",
      "Local tutors matched by your locality for punctuality",
    ],
    subjects: CORE_SUBJECTS,
    faqs: [
      { q: "How punctual are home visits?", a: "Tutors are matched by travel distance from your locality, which is the single biggest factor in punctuality." },
      { q: "What if the tutor misses a class?", a: "Missed classes are made up within the same month or adjusted in the fee." },
      { q: "Can offline classes move online temporarily?", a: "Yes, during exams, illness or travel we shift to online without changing the tutor." },
    ],
  },
];

export const ALL_LANDING_SLUGS = [
  ...AREA_PAGES.map((p) => p.slug),
  ...TOPIC_PAGES.map((p) => p.slug),
];

/* ─────────────────────────────────────────────────────────────
   Site-wide FAQ (used on /faq with FAQPage structured data)
   ───────────────────────────────────────────────────────────── */
export const FAQ_GROUPS = [
  {
    heading: "Getting started",
    items: [
      { q: "How do I book a home tutor with Gayatri Home Tutors?", a: "Call +91 85059 52700 or fill the demo form on our contact page. We collect the class, subjects, board and locality, then share matching tutor profiles — usually within 24 hours." },
      { q: "Is the first class really free?", a: "Yes. The first demo class is free and carries no obligation. You pay only if you decide to continue with that tutor." },
      { q: "How long does it take to arrange a tutor?", a: "Most Delhi NCR localities are matched within 24 to 48 hours. Specialist requirements such as IB, ISC or drop-year JEE may take slightly longer." },
      { q: "Do parents pay any registration or agency fee?", a: "No. Parents pay only the agreed monthly tuition fee. There is no separate registration charge." },
      { q: "Which areas of Delhi NCR do you cover?", a: "All of Delhi plus Noida, Greater Noida, Gurgaon, Ghaziabad and Faridabad. Rohini, Pitampura, Model Town, Janakpuri, Dwarka, Paschim Vihar, Ashok Vihar and Laxmi Nagar have the deepest tutor availability." },
    ],
  },
  {
    heading: "Tutors and verification",
    items: [
      { q: "Are your tutors verified?", a: "Yes. Every tutor submits photo ID, address proof and qualification documents, which we check before any placement or home visit." },
      { q: "Can I request a female tutor?", a: "Yes, female tutors are available for all classes and subjects. Mention the preference when you enquire." },
      { q: "What qualifications do your tutors have?", a: "Tutors range from postgraduate subject specialists and B.Ed. teachers to engineering and medical graduates for competitive-exam preparation." },
      { q: "Can I change the tutor if my child is not comfortable?", a: "Yes. Tell us after any class and we arrange a replacement demo at no extra cost." },
      { q: "Will the same tutor teach every session?", a: "Yes. Continuity matters, so one tutor is assigned to your child for the whole engagement." },
      { q: "Do you conduct background checks?", a: "We verify identity, address and qualifications. Additional checks can be requested for long-term placements." },
    ],
  },
  {
    heading: "Classes, subjects and boards",
    items: [
      { q: "Which classes do you teach?", a: "Class 1 to Class 12, plus competitive-exam preparation for JEE and NEET and spoken English for adults." },
      { q: "Which boards do you support?", a: "CBSE, ICSE, ISC, IB, IGCSE, NIOS and the Delhi state syllabus." },
      { q: "Which subjects are available?", a: "Mathematics, Physics, Chemistry, Biology, English, Hindi, Sanskrit, Social Science, Computer Science, Accountancy, Business Studies and Economics, among others." },
      { q: "Can one tutor teach multiple subjects?", a: "For primary and middle classes, yes. For Class 11 and 12 we recommend subject specialists for genuine depth." },
      { q: "Do you help with school homework and projects?", a: "Yes, homework support and project guidance are part of the session, though the student does the actual work." },
      { q: "Do you prepare students for Olympiads and NTSE?", a: "Yes, foundation preparation can be added alongside regular school tuition." },
    ],
  },
  {
    heading: "Scheduling and fees",
    items: [
      { q: "How many classes per week do you recommend?", a: "Three to four sessions per week suits most students. Board-exam classes often move to five, and primary students do well with shorter, more frequent sessions." },
      { q: "How long is each session?", a: "Sixty minutes for primary, 60 to 90 minutes for middle and senior classes. Combined two-subject slots run 90 minutes." },
      { q: "What are the tuition fees?", a: "Fees depend on class, number of subjects and tutor experience. We confirm the exact monthly fee before the free demo, so there are no surprises." },
      { q: "Can siblings share a class?", a: "Yes. Siblings or two neighbouring students of the same class can share a slot at a reduced per-student fee." },
      { q: "What happens if we travel or the child falls ill?", a: "Classes can be paused, rescheduled or shifted online, and the monthly fee is adjusted for missed sessions." },
      { q: "How is the fee paid?", a: "Fees are paid monthly, directly to the tutor, at the start of each cycle unless agreed otherwise." },
    ],
  },
  {
    heading: "For tutors",
    items: [
      { q: "How do I apply to become a tutor?", a: "Fill the Become a Tutor form with your qualifications, subjects, classes and preferred areas. Our team reviews the application and contacts shortlisted candidates." },
      { q: "Do tutors pay any joining fee?", a: "No joining fee is charged to register on our panel." },
      { q: "How are tuition assignments allotted?", a: "Assignments are matched by subject expertise, class level, board experience and distance from the student's home." },
      { q: "Can I choose my preferred areas and timings?", a: "Yes, you specify preferred localities and available time slots in your application, and we match accordingly." },
      { q: "Is online teaching available for tutors?", a: "Yes, tutors can opt for online, offline or both formats." },
    ],
  },
];

export const ALL_FAQS = FAQ_GROUPS.flatMap((g) => g.items);
