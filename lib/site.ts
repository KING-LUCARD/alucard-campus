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
  { to: "/home", label: "Home" },
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

import sciencesImg from "@/assets/lab.jpg";
import mathematicsImg from "@/assets/mathematics.jpg";
import humanitiesImg from "@/assets/humanities.jpg";
import technologyImg from "@/assets/coding.jpg";
import languagesImg from "@/assets/languages.jpg";
import creativeArtsImg from "@/assets/creative-arts.jpg";

export const programs = [
  { title: "Sciences", desc: "Physics, chemistry, and biology taught through inquiry and real laboratory work.", icon: "FlaskConical", image: sciencesImg, alt: "Students carrying out an experiment in a science laboratory" },
  { title: "Mathematics", desc: "From foundations to further mathematics, with problem-solving at the centre.", icon: "Sigma", image: mathematicsImg, alt: "A teacher and students solving geometry problems on a chalkboard" },
  { title: "Humanities", desc: "History, literature, and philosophy that sharpen argument and empathy.", icon: "BookOpen", image: humanitiesImg, alt: "Students discussing literature together in the school library" },
  { title: "Technology", desc: "Computer science, robotics, and design thinking for a digital future.", icon: "Cpu", image: technologyImg, alt: "Students working on laptops and a robot in coding club" },
  { title: "Languages", desc: "Fluency in English, French, and Spanish through immersion and dialogue.", icon: "Languages", image: languagesImg, alt: "Students practising conversation in a bright language classroom" },
  { title: "Creative Arts", desc: "Music, visual art, and drama that cultivate expression and craft.", icon: "Palette", image: creativeArtsImg, alt: "A student painting at an easel in the school art studio" },
] as const;

import sportsImg from "@/assets/sports.jpg";
import basketballImg from "@/assets/basketball.jpg";
import debateImg from "@/assets/debate.jpg";
import codingImg from "@/assets/coding.jpg";
import labImg from "@/assets/lab.jpg";
import studentsImg from "@/assets/students.jpg";
import libraryImg from "@/assets/library.jpg";

export const newsCategories = ["Sports", "Academics", "Student Life", "Achievements", "Announcements"] as const;
export type Article = {
  slug: string;
  title: string;
  date: string;
  category: (typeof newsCategories)[number] | "Event";
  excerpt: string;
  body: string[];
  image: string;
  alt: string;
  location?: string;
};

// Demonstration articles and events only — replace with school-confirmed content. Dates are illustrative.
const demo = "This is demonstration content and will be replaced once the school confirms details.";
export const articles: Article[] = [
  { slug: "inter-house-sports", title: "Inter-House Sports Competition", date: "2026-10-12", category: "Sports", image: sportsImg, alt: "Students in burgundy kits running a relay race on the school track", excerpt: "Houses compete in relays, sprints and field events in a celebration of teamwork.", body: ["Inter-house sports bring every class together to compete, cheer and build house spirit.", demo] },
  { slug: "basketball-championship", title: "Basketball Championship", date: "2026-10-05", category: "Sports", image: basketballImg, alt: "Students in uniform playing basketball on an outdoor court", excerpt: "Teams battle on court as students practise strategy, discipline and fair play.", body: ["Our basketball programme develops skill, fitness and leadership on and off the court.", demo] },
  { slug: "science-innovation-exhibition", title: "Science and Innovation Exhibition", date: "2026-09-28", category: "Academics", image: labImg, alt: "Students carrying out an experiment in a science laboratory", excerpt: "Students present investigations and prototypes across physics, chemistry and biology.", body: ["The exhibition showcases inquiry-led projects designed and tested by students.", demo] },
  { slug: "debate-competition", title: "Debate Competition", date: "2026-09-20", category: "Student Life", image: debateImg, alt: "A student speaking at a podium during a debate", excerpt: "Debaters sharpen argument, research and public speaking before a live audience.", body: ["Debate builds confidence, critical thinking and respect for opposing views.", demo] },
  { slug: "cultural-day", title: "Cultural Day Celebration", date: "2026-09-12", category: "Student Life", image: studentsImg, alt: "Students together on campus", excerpt: "A day of music, dress, food and stories celebrating the cultures in our community.", body: ["Cultural Day invites students to share heritage and learn from one another.", demo] },
  { slug: "student-achievement-awards", title: "Student Achievement Awards", date: "2026-09-05", category: "Achievements", image: codingImg, alt: "Students working together on laptops and a robot in coding club", excerpt: "Recognising effort, character and excellence across academics, arts and service.", body: ["Awards celebrate students who show excellence, integrity and leadership.", demo] },
  { slug: "new-academic-session", title: "New Academic Session", date: "2026-09-01", category: "Announcements", image: libraryImg, alt: "School library with study tables", excerpt: "Welcome guidance for families as JSS1–SS3 classes begin the new session.", body: ["Families will receive timetables, uniform guidance and class information before resumption.", demo] },
  { slug: "open-day", title: "Admissions Open Day", date: "2026-11-28", category: "Event", location: "Main campus, Lekki", image: studentsImg, alt: "Students on campus", excerpt: "Tour the campus, meet teachers and learn how to apply.", body: ["Prospective families can tour the campus and speak with staff.", demo] },
  { slug: "science-fair", title: "Science & Innovation Fair", date: "2026-11-14", category: "Event", location: "School hall", image: labImg, alt: "Science laboratory", excerpt: "Families explore student projects in science and technology.", body: ["An afternoon of student-led demonstrations.", demo] },
  { slug: "sports-day", title: "Inter-House Sports Day", date: "2026-12-05", category: "Event", location: "School field", image: sportsImg, alt: "Students running on the track", excerpt: "Track and field finals with houses competing for the trophy.", body: ["Parents and guardians are welcome to cheer.", demo] },
];

export const testimonials = [
  { quote: "My daughter found teachers who challenge her and genuinely care about how she thinks.", who: "Parent of a Year 10 student", note: "Sample testimonial" },
  { quote: "The labs and the debate club changed what I believed I could do.", who: "Senior student", note: "Sample testimonial" },
  { quote: "A rare place where rigour and kindness live side by side.", who: "Visiting educator", note: "Sample testimonial" },
];

export function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
