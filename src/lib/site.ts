// Central school configuration. Edit here to update branding and contact details site-wide.
// Values marked PLACEHOLDER must be replaced with real school information.
export const school = {
  name: "ALUCARD INSTITUTE",
  short: "Alucard",
  motto: "Lux in Disciplina",
  tagline: "A School Where Inquiry Shapes the Future.",
  address: "Lekki",
  phone: "+2347078128869",
  email: "desdara247@gmail.com",
  hours: [
    { d: "Monday – Friday", h: "7:30 AM – 4:30 PM" },
    { d: "Saturday", h: "9:00 AM – 1:00 PM" },
    { d: "Sunday", h: "Closed" },
  ],
  socials: [
    { name: "Instagram", href: "#" },
    { name: "LinkedIn", href: "#" },
    { name: "YouTube", href: "#" },
    { name: "X", href: "#" },
  ],
};

export const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/academics", label: "Academics" },
  { to: "/admissions", label: "Admissions" },
  { to: "/student-life", label: "Student Life" },
  { to: "/news", label: "News & Events" },
  { to: "/contact", label: "Contact" },
] as const;

export const schoolClasses = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'] as const;
export const coreSubjects = ['Mathematics', 'English'] as const;
// Illustrative subject offerings; the school must confirm its final curriculum.
export const departments = [
  { name: 'Science', description: 'Explore the natural world through investigation, evidence and practical discovery.', subjects: ['Biology', 'Chemistry', 'Physics', 'Further Mathematics', 'Computer Studies'] },
  { name: 'Commercial', description: 'Understand enterprise, economic decisions and the foundations of responsible business.', subjects: ['Financial Accounting', 'Commerce', 'Economics', 'Business Studies', 'Computer Studies'] },
  { name: 'Arts', description: 'Develop expression, critical thought and a deeper understanding of people and society.', subjects: ['Literature in English', 'Government', 'History', 'Visual Arts', 'French'] },
] as const;

// Sample figures — replace with verified school data.
export const stats = [
  { value: 1240, suffix: "+", label: "Students enrolled", pct: 82 },
  { value: 96, suffix: "", label: "Teaching staff", pct: 64 },
  { value: 18, suffix: "", label: "Academic programs", pct: 48 },
  { value: 42, suffix: "", label: "Competition awards", pct: 70 },
];

export const programs = [
  { title: "Sciences", desc: "Physics, chemistry, and biology taught through inquiry and real laboratory work.", icon: "FlaskConical" },
  { title: "Mathematics", desc: "From foundations to further mathematics, with problem-solving at the centre.", icon: "Sigma" },
  { title: "Humanities", desc: "History, literature, and philosophy that sharpen argument and empathy.", icon: "BookOpen" },
  { title: "Technology", desc: "Computer science, robotics, and design thinking for a digital future.", icon: "Cpu" },
  { title: "Languages", desc: "Fluency in English, French, and Spanish through immersion and dialogue.", icon: "Languages" },
  { title: "Creative Arts", desc: "Music, visual art, and drama that cultivate expression and craft.", icon: "Palette" },
] as const;

export type Article = {
  slug: string;
  title: string;
  date: string;
  category: "News" | "Announcement" | "Event";
  excerpt: string;
  body: string[];
};

// Sample articles — illustrative only.
export const articles: Article[] = [
  {
    slug: "new-science-wing-opens",
    title: "The new science wing opens its doors",
    date: "2026-10-12",
    category: "News",
    excerpt: "Six purpose-built laboratories give students room to experiment, fail, and discover.",
    body: [
      "This term our students began working in the newly completed science wing, featuring six laboratories and a shared research commons.",
      "Teachers have redesigned the practical curriculum so every student completes at least one independent investigation per term.",
      "This is sample content — replace with real school news.",
    ],
  },
  {
    slug: "term-two-registration",
    title: "Term two course registration now open",
    date: "2026-10-05",
    category: "Announcement",
    excerpt: "Students should confirm elective choices with their form tutor before the deadline.",
    body: [
      "Course registration for term two is now open in the student portal.",
      "Please confirm elective selections with your form tutor. This is sample content.",
    ],
  },
  {
    slug: "annual-science-fair",
    title: "Annual Science & Innovation Fair",
    date: "2026-11-14",
    category: "Event",
    excerpt: "Families are invited to explore student projects across physics, biology, and engineering.",
    body: [
      "Join us in the main hall for an afternoon of student-led demonstrations and research posters.",
      "Doors open at 10:00 AM. This is sample content.",
    ],
  },
  {
    slug: "debate-team-regional",
    title: "Debate team advances to regional finals",
    date: "2026-09-28",
    category: "News",
    excerpt: "Our senior debaters argued their way through four rounds to reach the finals.",
    body: ["After four rounds, the senior debate team secured a place in the regional finals. Sample content."],
  },
  {
    slug: "open-day",
    title: "Admissions Open Day",
    date: "2026-11-28",
    category: "Event",
    excerpt: "Tour the campus, meet teachers, and learn about the application process.",
    body: ["Prospective families can tour the campus and speak with faculty. Sample content."],
  },
  {
    slug: "mid-term-break",
    title: "Mid-term break schedule",
    date: "2026-10-18",
    category: "Announcement",
    excerpt: "Classes pause for one week; the library remains open with reduced hours.",
    body: ["Classes will pause for mid-term break. The library will remain open 9 AM – 1 PM. Sample content."],
  },
];

export const testimonials = [
  { quote: "My daughter found teachers who challenge her and genuinely care about how she thinks.", who: "Parent of a Year 10 student", note: "Sample testimonial" },
  { quote: "The labs and the debate club changed what I believed I could do.", who: "Senior student", note: "Sample testimonial" },
  { quote: "A rare place where rigour and kindness live side by side.", who: "Visiting educator", note: "Sample testimonial" },
];

export function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
