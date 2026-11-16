/*
 * A dictionary of canonical tech skills, so a posting and a profile can be compared by meaning rather than spelling:
 * "k8s", "Kubernetes" and "kubernetes" are one skill; "NodeJS" and "node.js" are one skill.
 *
 * Matching is word-bounded and symbol-aware (c++, c#, .net, node.js). Words that are also plain English
 * (go, spark, swift, rest, react, express, spring...) only match in a tech context: case-sensitively, and next to a
 * list separator or a tech word ("Python, Go, Java", "experience in Swift", "REST APIs").
 */

export type SkillGroup =
  | 'language'
  | 'web'
  | 'backend'
  | 'mobile'
  | 'database'
  | 'cloud-devops'
  | 'data-ml-libs'
  | 'ml-ai'
  | 'cs-fundamentals'
  | 'tools'

type Def = {
  name: string
  group: SkillGroup
  /** Case-insensitive spellings that are safe anywhere. */
  aliases: string[]
  /** Case-sensitive spellings (acronyms such as AI, ML, RAG). */
  exact: string[]
  /** Case-sensitive words that are also English; matched only in a tech context. */
  ctx: string[]
  /** Names that map to this skill when canonicalising a profile, but are never searched for in text. */
  lookup: string[]
}

type Options = { exact?: string[]; ctx?: string[]; lookup?: string[] }

const defs: Def[] = []

/** A skill whose name is safe to search for as-is, plus its other spellings. */
function add(group: SkillGroup, name: string, aliases: string[] = [], o: Options = {}) {
  defs.push({
    name,
    group,
    aliases: [name, ...aliases],
    exact: o.exact ?? [],
    ctx: o.ctx ?? [],
    lookup: o.lookup ?? [],
  })
}

/** A skill whose bare name is an English word or a single letter: the name is not searched for, only the listed spellings. */
function addAmbiguous(group: SkillGroup, name: string, aliases: string[], o: Options) {
  defs.push({ name, group, aliases, exact: o.exact ?? [], ctx: o.ctx ?? [], lookup: [name, ...(o.lookup ?? [])] })
}

// Languages
add('language', 'javascript', ['js', 'es6', 'ecmascript', 'vanilla js'])
add('language', 'typescript', ['ts'])
add('language', 'python', ['python3', 'python 3'])
add('language', 'java')
addAmbiguous('language', 'c', [], { ctx: ['C'] })
add('language', 'c++', ['cpp'])
add('language', 'c#', ['csharp', 'c sharp'])
addAmbiguous('language', 'go', ['golang'], { ctx: ['Go'] })
add('language', 'rust')
add('language', 'kotlin')
addAmbiguous('language', 'swift', [], { ctx: ['Swift'] })
add('language', 'objective-c', ['objc'])
add('language', 'ruby')
add('language', 'php')
add('language', 'scala')
addAmbiguous('language', 'r', [], { ctx: ['R'] })
add('language', 'dart')
add('language', 'bash', ['shell scripting', 'shell script'])
add('language', 'sql')
add('language', 'plsql', ['pl/sql'])
add('language', 'html', ['html5'])
add('language', 'css', ['css3'])
add('language', 'perl')
add('language', 'lua')
add('language', 'elixir')
add('language', 'haskell')
add('language', 'solidity')
add('language', 'matlab')
addAmbiguous('language', 'assembly', ['assembly language', 'x86 assembly'], {})

// Web frameworks and front-end tooling
addAmbiguous('web', 'react', ['react.js', 'reactjs', 'react js'], { ctx: ['React'] })
add('web', 'next.js', ['nextjs', 'next js'])
add('web', 'vue', ['vue.js', 'vuejs', 'vue js'])
add('web', 'nuxt', ['nuxt.js', 'nuxtjs'])
add('web', 'angular', ['angularjs', 'angular.js'])
add('web', 'svelte', ['sveltekit'])
add('web', 'redux', ['redux toolkit'])
add('web', 'jquery')
add('web', 'tailwind', ['tailwindcss', 'tailwind css'])
addAmbiguous('web', 'bootstrap', ['bootstrap 5', 'bootstrap css'], { ctx: ['Bootstrap'] })
add('web', 'sass', ['scss'])
add('web', 'webpack')
add('web', 'vite')
addAmbiguous('web', 'astro', ['astro.js'], { ctx: ['Astro'] })
addAmbiguous('web', 'remix', ['remix.run'], { ctx: ['Remix'] })
add('web', 'd3', ['d3.js', 'd3js'])
add('web', 'three.js', ['threejs'])
add('web', 'webassembly', ['wasm'])
add('web', 'websockets', ['websocket', 'web sockets', 'socket.io'])
add('web', 'responsive design', ['responsive web design'])

// Backend frameworks and API styles
add('backend', 'node.js', ['nodejs', 'node js'], { ctx: ['Node'], lookup: ['node'] })
addAmbiguous('backend', 'express', ['express.js', 'expressjs'], { ctx: ['Express'] })
add('backend', 'nestjs', ['nest.js', 'nest js'])
add('backend', 'django', ['django rest framework', 'drf'])
add('backend', 'flask')
add('backend', 'fastapi')
addAmbiguous('backend', 'spring', ['spring boot', 'springboot', 'spring framework', 'spring mvc'], { ctx: ['Spring'] })
add('backend', 'laravel')
addAmbiguous('backend', 'rails', ['ruby on rails', 'ror'], { ctx: ['Rails'] })
add('backend', '.net', ['dotnet', 'dot net', '.net core', 'asp.net', 'asp.net core'])
add('backend', 'hibernate')
add('backend', 'graphql')
add('backend', 'grpc')
addAmbiguous(
  'backend',
  'rest',
  ['restful', 'rest api', 'rest apis', 'restful api', 'restful apis', 'restful services'],
  { ctx: ['REST'] },
)
add('backend', 'microservices', ['microservice', 'micro-services', 'micro services'])
add('backend', 'oauth', ['oauth2', 'oauth 2.0', 'openid connect', 'oidc'])
add('backend', 'jwt')
add('backend', 'openapi', ['swagger'])
add('backend', 'celery')
add('backend', 'rabbitmq')
add('backend', 'kafka', ['apache kafka'])
add('backend', 'event-driven architecture', ['event driven', 'event-driven'])

// Mobile
add('mobile', 'android', ['android sdk', 'android development'])
add('mobile', 'ios', ['ios development'])
add('mobile', 'swiftui')
add('mobile', 'jetpack compose', ['compose multiplatform'])
add('mobile', 'react native', ['react-native', 'reactnative'])
add('mobile', 'flutter')
addAmbiguous('mobile', 'expo', ['expo router', 'expo go', 'expo sdk', 'eas build'], { ctx: ['Expo'] })
add('mobile', 'xcode')
add('mobile', 'kotlin multiplatform')
add('mobile', 'ionic')
add('mobile', 'xamarin')
addAmbiguous('mobile', 'unity', ['unity3d', 'unity 3d'], { ctx: ['Unity'] })

// Databases and storage
add('database', 'postgresql', ['postgres', 'psql'])
add('database', 'mysql')
add('database', 'mongodb', ['mongo'])
add('database', 'redis')
add('database', 'sqlite')
add('database', 'dynamodb')
add('database', 'cassandra')
add('database', 'elasticsearch', ['elastic search', 'opensearch'])
add('database', 'firebase', ['firestore'])
add('database', 'supabase')
add('database', 'sql server', ['mssql', 'ms sql', 'microsoft sql server', 't-sql', 'tsql'])
add('database', 'nosql', ['no-sql'])
add('database', 'neo4j')
add('database', 'prisma')
add('database', 'sqlalchemy')
add('database', 'vector database', [
  'vector databases',
  'vector db',
  'vector store',
  'vector stores',
  'pinecone',
  'pgvector',
  'faiss',
  'chromadb',
  'weaviate',
  'milvus',
  'qdrant',
])
add('database', 'database design', ['schema design', 'data modeling', 'data modelling'])

// Cloud, DevOps and infrastructure
add('cloud-devops', 'aws', ['amazon web services', 'ec2', 'aws lambda', 'amazon s3'])
add('cloud-devops', 'gcp', ['google cloud', 'google cloud platform'])
add('cloud-devops', 'azure', ['microsoft azure'])
add('cloud-devops', 'docker', ['dockerfile', 'docker compose', 'containerization'])
add('cloud-devops', 'kubernetes', ['k8s'])
add('cloud-devops', 'terraform')
add('cloud-devops', 'ansible')
add('cloud-devops', 'jenkins')
add('cloud-devops', 'github actions')
add('cloud-devops', 'gitlab ci', ['gitlab-ci'])
add('cloud-devops', 'ci/cd', [
  'cicd',
  'ci cd',
  'continuous integration',
  'continuous delivery',
  'continuous deployment',
])
add('cloud-devops', 'linux', ['unix'])
add('cloud-devops', 'nginx')
add('cloud-devops', 'prometheus')
add('cloud-devops', 'grafana')
addAmbiguous('cloud-devops', 'helm', ['helm chart', 'helm charts'], { ctx: ['Helm'] })
add('cloud-devops', 'serverless')
add('cloud-devops', 'devops')
add('cloud-devops', 'sre', ['site reliability'])
add('cloud-devops', 'observability', ['opentelemetry', 'datadog'])
add('cloud-devops', 'infrastructure as code', ['iac'])
add('cloud-devops', 'cloudflare')
add('cloud-devops', 'vercel')

// Data and ML libraries
add('data-ml-libs', 'pytorch')
add('data-ml-libs', 'tensorflow')
add('data-ml-libs', 'keras')
add('data-ml-libs', 'scikit-learn', ['sklearn', 'scikit learn'])
add('data-ml-libs', 'pandas')
add('data-ml-libs', 'numpy')
add('data-ml-libs', 'scipy')
add('data-ml-libs', 'matplotlib')
add('data-ml-libs', 'opencv')
add('data-ml-libs', 'xgboost', ['lightgbm', 'catboost'])
add('data-ml-libs', 'hugging face', ['huggingface'])
addAmbiguous('data-ml-libs', 'transformers', ['transformer models', 'transformer architecture'], {
  ctx: ['Transformers'],
})
add('data-ml-libs', 'langchain', ['langgraph'])
add('data-ml-libs', 'llamaindex', ['llama index'])
add('data-ml-libs', 'spacy')
add('data-ml-libs', 'nltk')
add('data-ml-libs', 'jax')
add('data-ml-libs', 'onnx')
addAmbiguous('data-ml-libs', 'spark', ['apache spark', 'pyspark', 'spark sql', 'spark streaming'], { ctx: ['Spark'] })
add('data-ml-libs', 'hadoop', ['mapreduce'])
add('data-ml-libs', 'airflow', ['apache airflow'])
add('data-ml-libs', 'dbt')
add('data-ml-libs', 'snowflake')
add('data-ml-libs', 'bigquery')
add('data-ml-libs', 'databricks')
add('data-ml-libs', 'power bi', ['powerbi'])
add('data-ml-libs', 'tableau')
add('data-ml-libs', 'etl', ['elt', 'data pipelines', 'data pipeline'])
add('data-ml-libs', 'mlflow')

// ML and AI concepts
add('ml-ai', 'machine learning', [], { exact: ['ML'] })
add('ml-ai', 'deep learning')
add('ml-ai', 'artificial intelligence', [], { exact: ['AI'] })
add('ml-ai', 'llm', ['llms', 'large language model', 'large language models'])
add('ml-ai', 'generative ai', ['genai', 'gen ai', 'generative models'])
addAmbiguous('ml-ai', 'rag', ['retrieval augmented generation'], { exact: ['RAG'] })
add('ml-ai', 'nlp', ['natural language processing'])
add('ml-ai', 'computer vision')
add('ml-ai', 'neural networks', ['neural network', 'cnn', 'rnn', 'lstm'])
add('ml-ai', 'reinforcement learning')
add('ml-ai', 'prompt engineering', ['prompt design'])
add('ml-ai', 'fine-tuning', ['finetuning', 'lora', 'peft'])
add('ml-ai', 'mlops', ['ml ops', 'model deployment'])
add('ml-ai', 'data science')
add('ml-ai', 'data analysis', ['data analytics', 'exploratory data analysis'])
add('ml-ai', 'statistics', ['statistical modeling', 'statistical modelling'])
add('ml-ai', 'ai agents', ['agentic', 'agentic ai', 'ai agent', 'multi-agent'])
add('ml-ai', 'speech recognition', ['asr', 'speech to text', 'stt', 'speech processing'], { lookup: ['speech'] })
add(
  'ml-ai',
  'voice ai',
  [
    'voice agent',
    'voice agents',
    'voice assistant',
    'voice assistants',
    'conversational ai',
    'text to speech',
    'tts',
    'voice bot',
    'voicebot',
  ],
  { lookup: ['voice'] },
)
add('ml-ai', 'recommendation systems', ['recommender systems', 'recommendation engine'])
add('ml-ai', 'time series', ['forecasting'])
add('ml-ai', 'embeddings')

// CS fundamentals
add('cs-fundamentals', 'data structures', ['dsa', 'data structures and algorithms'])
add('cs-fundamentals', 'algorithms', ['dsa', 'data structures and algorithms'])
add('cs-fundamentals', 'object-oriented programming', ['oop', 'object oriented', 'object-oriented design'])
add('cs-fundamentals', 'operating systems', ['operating system'])
add('cs-fundamentals', 'computer networks', ['computer networking', 'tcp/ip'])
add('cs-fundamentals', 'dbms', ['database management systems', 'rdbms', 'relational databases', 'relational database'])
add('cs-fundamentals', 'system design', [
  'low level design',
  'high level design',
  'lld',
  'hld',
  'software architecture',
])
add('cs-fundamentals', 'distributed systems', ['distributed computing'])
add('cs-fundamentals', 'concurrency', ['multithreading', 'multithreaded', 'parallel programming', 'async programming'])
add('cs-fundamentals', 'design patterns')
add('cs-fundamentals', 'functional programming')
add('cs-fundamentals', 'compilers', ['compiler design'])
add('cs-fundamentals', 'cryptography', ['applied cryptography'])
add('cs-fundamentals', 'cybersecurity', ['application security', 'appsec', 'secure coding', 'owasp'])
add('cs-fundamentals', 'embedded systems', ['embedded software', 'firmware', 'rtos'])
add('cs-fundamentals', 'iot', ['internet of things'])
add('cs-fundamentals', 'blockchain', ['smart contracts', 'web3'])
add('cs-fundamentals', 'performance optimization', ['performance tuning', 'low latency'])
add('cs-fundamentals', 'caching', ['cache invalidation'])

// Tools and testing
add('tools', 'git', ['version control'])
add('tools', 'github')
add('tools', 'gitlab')
add('tools', 'jira')
add('tools', 'postman')
add('tools', 'unit testing', ['unit tests', 'test-driven development', 'tdd', 'integration testing'])
add('tools', 'jest')
add('tools', 'pytest')
add('tools', 'junit')
add('tools', 'selenium')
add('tools', 'cypress')
add('tools', 'playwright')
add('tools', 'storybook')
add('tools', 'figma')

// --- Matching engine ---

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Spaces and hyphens inside an alias are interchangeable ("scikit learn", "scikit-learn"). */
const body = (alias: string) =>
  alias
    .split(/[\s-]+/)
    .map(escape)
    .join('[\\s-]+')

const PRE = '(?<![a-z0-9_]|[a-z0-9_]\\.)'
const POST = '(?![a-z0-9_]|\\.[a-z0-9])'
/** What may sit just before / after a case-sensitive, English-looking word for it to count as a skill. */
const CTX_BEFORE =
  '(?:(?<=^[ \\t•*-]*)|(?<=[,/(•·|;:]\\s*)|(?<=\\b(?:[Ii]n|[Aa]nd|[Oo]r|[Ww]ith|[Uu]sing|[Oo]f|[Oo]n|[Ll]ike|[Ii]ncluding)\\s+))'
const CTX_AFTER =
  '(?=\\s*(?:[,/)•·|;.]|$)|\\s+(?:and|or|programming|language|developers?|engineers?|framework|experience|API|APIs)\\b)'

type Compiled = { name: string; insensitive: RegExp | null; sensitive: RegExp | null }

const compiled: Compiled[] = defs.map((d) => {
  const ci = d.aliases.map((a) => `${PRE}${body(a)}${POST}`)
  const cs = [
    ...d.exact.map((a) => `${PRE}${body(a)}${POST}`),
    ...d.ctx.map((w) => `${CTX_BEFORE}${escape(w)}${CTX_AFTER}`),
  ]
  return {
    name: d.name,
    insensitive: ci.length ? new RegExp(ci.join('|'), 'i') : null,
    sensitive: cs.length ? new RegExp(cs.join('|'), 'm') : null,
  }
})

const lookup = new Map<string, string>()
for (const d of defs) lookup.set(d.name, d.name)
// Spellings can be shared ("dsa"): the first definition wins, and a canonical name always wins over an alias.
for (const d of defs) {
  for (const a of [...d.aliases, ...d.lookup, ...d.exact, ...d.ctx]) {
    const key = a.toLowerCase().trim()
    if (!lookup.has(key)) lookup.set(key, d.name)
  }
}

/** The canonical name for a skill spelling ("NodeJS" → "node.js", "k8s" → "kubernetes"). Unknown skills come back trimmed and lower-cased. */
export function canonicalSkill(name: string): string {
  const key = name.toLowerCase().trim().replace(/\s+/g, ' ')
  return lookup.get(key) ?? key
}

/** Every known skill with its group, for UI that wants to list or suggest them. */
export function knownSkills(): { name: string; group: SkillGroup }[] {
  return defs.map((d) => ({ name: d.name, group: d.group }))
}

/** Canonical skills the text mentions, in order of first appearance, without duplicates. */
export function extractSkills(text: string): string[] {
  if (!text) return []
  const found: { name: string; at: number }[] = []
  for (const c of compiled) {
    let at = -1
    for (const re of [c.insensitive, c.sensitive]) {
      if (!re) continue
      const m = re.exec(text)
      if (m && (at === -1 || m.index < at)) at = m.index
    }
    if (at !== -1) found.push({ name: c.name, at })
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.name)
}
