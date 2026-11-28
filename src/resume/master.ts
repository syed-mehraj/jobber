import type { Bullet, ResumeContent, SkillGroup } from './types'

/*
 * The master resume, taken from the owner's own current resume (PDF) plus the Jobber and AI Excel Analyst
 * projects. Never add a phone number or a street address here.
 */

/** Bullets with stable ids: bl('pl', [...]) gives b-pl-1, b-pl-2, … */
const bl = (scope: string, texts: string[]): Bullet[] => texts.map((text, i) => ({ id: `b-${scope}-${i + 1}`, text }))

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const group = (id: string, label: string, names: string[]): SkillGroup => ({
  id: `sk-${id}`,
  label,
  items: names.map((name) => ({ id: `s-${id}-${slug(name)}`, name })),
})

export const masterResume: ResumeContent = {
  version: 1,
  order: ['contact', 'summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'custom'],

  contact: {
    hidden: false,
    name: 'Syed Mehraj Ur Rahman',
    title: '',
    location: 'Hyderabad, India',
    email: 'smrmehraj123@gmail.com',
    github: 'github.com/syed-mehraj',
    linkedin: '',
    website: '',
  },

  summary: {
    hidden: false,
    text:
      'AI/ML and backend engineering student (3rd-year B.E., 9.0 CGPA) with experience on a production voice-AI ordering ' +
      'platform, plus hands-on work in CNN, RNN and ensemble models, LLM fine-tuning, RAG, and developer tooling such as ' +
      'regit, a custom GitHub management CLI.',
  },

  experience: {
    hidden: false,
    items: [
      {
        id: 'exp-parallel-labs',
        company: 'i110Labs (formerly NextGen Candid Solutions Pvt. Ltd.)',
        role: 'Software Developer – Intern',
        location: 'Hyderabad, India',
        start: 'July 2026',
        end: 'Present',
        bullets: bl('pl', [
          'Full-time, 3-month internship, reporting to the Director of IT.',
          'Worked on a production AI voice agent that takes restaurant phone orders and table reservations on a multi-restaurant ordering platform (TypeScript, NestJS, PostgreSQL); every change shipped as a code-reviewed pull request with tests.',
          'Improved ordering conversations: shorter, more natural calls, and better understanding of what callers actually ask for, including quantities, sizes, choices and corrections.',
          'Worked on reservation calls, call reliability and recovery when a call stalls, and the speech-recognition and voice side of the agent.',
          'Built cost tracking and operator dashboard controls for the voice agent, and a full-stack storefront feature across backend services and front ends.',
          'Analysed real call logs to find and fix issues, and tested every change against multiple restaurants’ menus.',
        ]),
      },
    ],
  },

  projects: {
    hidden: false,
    items: [
      {
        id: 'prj-jobber',
        name: 'Jobber – Job Search and Resume Builder',
        stack: 'Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Gemini API',
        dates: '2026',
        bullets: bl('jb', [
          'Built a full-stack web app that reads about 270 official job sources, scores each posting against your resume and shows the skills matched and missing; deployed on Vercel with Neon PostgreSQL and invite-only sign-in.',
          'Built a resume editor with a master resume, tailored copies per job, six ATS-safe templates, PDF/Word import and PDF export.',
          'Added a Gemini assistant that rewrites existing resume lines and gives per-job advice (fit, what to lead with, gaps), then creates a tailored resume from the edits you tick; code checks reject invented skills and ignore instructions hidden in job text.',
          'Covered by 200+ automated tests (Vitest) and per-user daily limits on AI use.',
        ]),
      },
      {
        id: 'prj-ai-excel-analyst',
        name: 'AI Excel Analyst – Chrome Extension',
        stack: 'TypeScript, DuckDB-Wasm, Chrome Extension (MV3), Vite',
        dates: '2026 – Present',
        bullets: bl('ea', [
          'Building a Chrome extension that lets an AI answer questions about very large Excel/CSV files without uploading them: the file is read and queried locally with DuckDB-Wasm in a Web Worker, and the AI only sees a small data profile and writes the SQL.',
          'Own the data engine: file readers with content-based format detection (csv, xlsx, xlsm, xlsb, xls, zip64, password-protected files), plus cleaning and profiling.',
          'Measured the limits in a spike: xlsx read up to 404 MB, and CSV streamed through DuckDB up to 6.45 GB.',
        ]),
      },
      {
        id: 'prj-translation',
        name: 'Multilingual Translation for Voice Ordering',
        stack: 'Python, PyTorch, LoRA',
        dates: '',
        bullets: bl('tr', [
          'Built a multilingual training dataset and fine-tuned a 3B-parameter translation model so callers can order in other languages; evaluated on held-out data with clear accuracy gains over the base model.',
        ]),
      },
      {
        id: 'prj-regit',
        name: 'regit – GitHub Management CLI Tool',
        stack: 'Python, GitHub REST API',
        dates: '',
        bullets: bl('rg', [
          'Built and open-sourced a Python CLI tool that automates GitHub repository management via the GitHub REST API.',
        ]),
      },
      {
        id: 'prj-rag-assistant',
        name: 'PDF RAG Assistant',
        stack: 'Gemini API, RAG',
        dates: '',
        bullets: bl('rag', [
          'Built a Retrieval-Augmented Generation pipeline that indexes PDF content and generates context-aware outputs using the Gemini API.',
        ]),
      },
      {
        id: 'prj-cnn-rnn',
        name: 'CNN Image Classification · RNN Sequence Modeling',
        stack: 'TensorFlow, Keras, LSTM',
        dates: '',
        bullets: bl('cnn', [
          'Designed a CNN image classifier with data augmentation and regularization; trained LSTM-based RNNs for time-series forecasting with optimized preprocessing and evaluation pipelines.',
        ]),
      },
      {
        id: 'prj-ml-models',
        name: 'Ensemble Learning · Heart Disease Prediction · Cattle Farm Analytics',
        stack: 'Python, Scikit-learn, TensorFlow',
        dates: '',
        bullets: bl('ml', [
          'Tuned Bagging, Boosting and Stacking ensembles that beat their base learners; benchmarked ML/DL classifiers on the Heart Disease UCI dataset (strong AUC-ROC); built regression/classification models for livestock health and milk yield.',
          'SU Knowledge Hub: core contributor on collaborative AI/data science projects (data wrangling, EDA, visualization).',
        ]),
      },
    ],
  },

  education: {
    hidden: false,
    items: [
      {
        id: 'edu-mjcet',
        school: 'Muffakham Jah College of Engineering & Technology',
        degree: 'B.E. in Artificial Intelligence and Machine Learning, Osmania University',
        location: '',
        start: '2023',
        end: '2027 (Expected)',
        score: 'CGPA: 9.0/10 | 6th Semester',
        bullets: [],
      },
    ],
  },

  skills: {
    hidden: false,
    groups: [
      group('lang', 'Languages', ['Python', 'TypeScript', 'JavaScript (Node.js)', 'SQL', 'C', 'Java (Basic)']),
      group('backend', 'Backend & Data', [
        'NestJS',
        'REST APIs',
        'PostgreSQL',
        'Prisma',
        'Redis',
        'Kafka',
        'Docker',
        'CI pipelines',
        'Git/GitHub',
      ]),
      group('voice', 'Real-time Voice & LLMs', [
        'Real-time voice (WebRTC/SIP)',
        'Speech-to-text and text-to-speech',
        'LLM APIs',
        'Tool calling',
        'RAG',
      ]),
      group('ml', 'ML / DL', [
        'PyTorch',
        'LoRA fine-tuning',
        'TensorFlow',
        'Keras',
        'Scikit-learn',
        'CNN',
        'RNN',
        'Ensemble Learning',
        'NumPy',
        'Pandas',
      ]),
    ],
  },

  certifications: {
    hidden: false,
    items: [{ id: 'cert-data-analysis-python', name: 'Data Analysis using Python', issuer: '', date: '' }],
  },

  custom: {
    hidden: false,
    title: 'Interests',
    bullets: bl('int', [
      'AI/ML, Generative AI & LLMs, Voice AI, Deep Learning, Developer Tooling, Fitness & Outdoor Sports, Cooking',
    ]),
  },
}
