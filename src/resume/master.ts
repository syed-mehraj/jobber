import type { Bullet, ResumeContent, SkillGroup } from './types'

/*
 * The master resume, built only from public facts: the portfolio site and the Parallel Labs work
 * document. Anything those do not state (dates, titles, numbers, links) is the text "TODO" for the
 * owner to fill in. Never add a phone number or a street address here.
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
    title: 'AI and machine learning student',
    location: 'Hyderabad, India',
    email: 'smrmehraj123@gmail.com',
    github: 'github.com/smrmehraj',
    linkedin: 'TODO',
    website: '',
  },

  summary: {
    hidden: false,
    text:
      'AI and machine learning student at MJCET, Hyderabad (CGPA 9.0, graduating 2027). I build and tune an AI voice agent ' +
      'at Parallel Labs that takes restaurant orders over the phone in real time. I have trained CNNs, LSTMs and ensemble ' +
      'models on real datasets, and I now work on generative AI: retrieval-augmented generation and developer tooling.',
  },

  experience: {
    hidden: false,
    items: [
      {
        id: 'exp-parallel-labs',
        company: 'Parallel Labs (Parcera)',
        role: 'Software Developer Intern',
        location: 'Hyderabad, India',
        start: 'Jul 2026',
        end: 'Present',
        bullets: bl('pl', [
          'Build and tune an AI voice agent that answers restaurant phone calls on a multi-restaurant ordering platform: callers order food or book tables by speaking, and the order goes to the restaurant’s point of sale.',
          'Moved order and reservation wording into the conversation engine so the model speaks exact lines instead of improvising on a live order, which shortened calls; measured every change against real call transcripts.',
          'Built a stuck-call watchdog that clears a stalled reply queue and hands the caller to a person, and engine-side consent checks so a vague “yeah” can no longer book a table.',
          'Added per-turn LLM cost accounting after the prompt-cache discount, and operator controls to switch voice, speaking speed and noise suppression without a deploy.',
          'Fine-tuned a 3-billion-parameter multilingual model on about 18,800 examples in five languages for a translation layer; on held-out rows, translation quality (chrF) rose from 62.5 to 82.1 and placeholder tags were preserved 100% of the time, up from 88%.',
          'Shipped every change as a reviewed pull request with tests, including hostile-input tests on every field a caller or merchant can type into.',
        ]),
      },
      {
        id: 'exp-steady',
        company: 'Steady',
        role: 'TODO',
        location: 'TODO',
        start: 'TODO',
        end: 'TODO',
        bullets: bl('st', [
          'Built NestJS microservices. TODO: say what each service did and the result.',
          'Built the Expo and Kotlin mobile app. TODO: say what it does and the result.',
        ]),
      },
    ],
  },

  projects: {
    hidden: false,
    items: [
      {
        id: 'prj-ai-excel-analyst',
        name: 'AI Excel Analyst',
        stack: 'TODO',
        dates: 'TODO',
        bullets: bl('ea', ['TODO: describe what it does, how it works and one measurable result.']),
      },
      {
        id: 'prj-portfolio',
        name: 'Personal portfolio',
        stack: 'React, TypeScript, Vite',
        dates: 'TODO',
        bullets: bl('pf', ['TODO: describe what the site shows and one thing about how it is built.']),
      },
      {
        id: 'prj-rag-assistant',
        name: 'PDF RAG Assistant',
        stack: 'Python, Gemini API',
        dates: '',
        bullets: bl('rag', [
          'Splits PDFs into chunks, indexes them, and answers questions with the Gemini API using the passages it retrieves.',
        ]),
      },
      {
        id: 'prj-regit',
        name: 'regit',
        stack: 'Python, GitHub REST API',
        dates: '',
        bullets: bl('rg', [
          'Open-source Python command-line tool that manages GitHub repositories through the GitHub REST API.',
        ]),
      },
      {
        id: 'prj-cnn',
        name: 'CNN Image Classifier',
        stack: 'TensorFlow, Keras',
        dates: '',
        bullets: bl('cnn', [
          'Image classifier trained with data augmentation and dropout so it holds up on images it has not seen.',
        ]),
      },
      {
        id: 'prj-lstm',
        name: 'LSTM Sequence Modeling',
        stack: 'TensorFlow, Keras',
        dates: '',
        bullets: bl('lstm', [
          'LSTM networks that forecast time series, with their own preprocessing and evaluation steps.',
        ]),
      },
      {
        id: 'prj-ensembles',
        name: 'Ensemble Learning',
        stack: 'Scikit-learn',
        dates: '',
        bullets: bl('ens', ['Bagging, Boosting and Stacking models, tuned and compared against single base learners.']),
      },
      {
        id: 'prj-heart',
        name: 'Heart Disease Prediction',
        stack: 'Python, Scikit-learn, TensorFlow',
        dates: '',
        bullets: bl('hd', [
          'Machine learning and deep learning classifiers on the Heart Disease UCI dataset, compared by AUC-ROC.',
        ]),
      },
      {
        id: 'prj-cattle',
        name: 'Cattle Farm Analytics',
        stack: 'Python, Scikit-learn',
        dates: '',
        bullets: bl('ct', [
          'Regression and classification models that predict milk yield and livestock health from farm records.',
        ]),
      },
      {
        id: 'prj-su-hub',
        name: 'SU Knowledge Hub',
        stack: 'Pandas, Data analysis',
        dates: '',
        bullets: bl('su', [
          'Core contributor to team projects in AI and data science: data wrangling, exploratory analysis, and charts the team used to decide what to do next.',
        ]),
      },
    ],
  },

  education: {
    hidden: false,
    items: [
      {
        id: 'edu-mjcet',
        school: 'Muffakham Jah College of Engineering and Technology (MJCET)',
        degree: 'B.E. in Artificial Intelligence and Machine Learning, Osmania University',
        location: 'Hyderabad, India',
        start: '2023',
        end: '2027',
        score: 'CGPA 9.0 / 10 (seventh semester)',
        bullets: [],
      },
    ],
  },

  skills: {
    hidden: false,
    groups: [
      group('lang', 'Languages', ['Python', 'TypeScript', 'C', 'Java']),
      group('ml', 'Machine learning', [
        'CNNs',
        'LSTMs',
        'Ensemble learning',
        'TensorFlow',
        'Keras',
        'PyTorch',
        'Scikit-learn',
        'LoRA fine-tuning',
      ]),
      group('genai', 'Generative AI', [
        'Retrieval-augmented generation',
        'LLM APIs',
        'Gemini API',
        'Voice agents',
        'Tool calling',
      ]),
      group('backend', 'Backend and mobile', [
        'Node.js',
        'NestJS',
        'PostgreSQL',
        'Prisma',
        'Kafka',
        'WebRTC',
        'Expo',
        'Kotlin',
      ]),
      group('data', 'Data', ['NumPy', 'Pandas', 'Data analysis']),
      group('tools', 'Tools', ['Git', 'GitHub', 'GitHub REST API', 'Docker', 'Elasticsearch', 'CI pipelines']),
    ],
  },

  certifications: {
    hidden: false,
    items: [{ id: 'cert-data-analysis-python', name: 'Data Analysis using Python', issuer: 'TODO', date: 'TODO' }],
  },

  custom: { hidden: true, title: 'Additional', bullets: [] },
}
