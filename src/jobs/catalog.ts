/**
 * Every source the search checks. Company boards were verified against each ATS's public API.
 * Edit here to add or remove companies; the app syncs this list into the database on start.
 */
export type CatalogEntry = { key: string; kind: string; name: string; config: Record<string, string> }

/** Aggregated lists that reach far beyond the company boards below. */
const aggregated: CatalogEntry[] = [
  {
    key: 'simplify:new-grad',
    kind: 'simplify',
    name: 'SimplifyJobs new-grad list',
    config: { repo: 'New-Grad-Positions', kind: 'new-grad' },
  },
  {
    key: 'simplify:internships',
    kind: 'simplify',
    name: 'SimplifyJobs internship list',
    config: { repo: 'Summer2027-Internships', kind: 'intern' },
  },
  {
    key: 'github:vanshb03-internships',
    kind: 'simplify',
    name: 'vanshb03 internship list',
    config: { owner: 'vanshb03', repo: 'Summer2027-Internships', kind: 'intern' },
  },
  { key: 'hn:who-is-hiring', kind: 'hackernews', name: 'Hacker News: Who is hiring', config: {} },
]

/**
 * Company career boards on public ATS APIs, verified 16 Nov 2026 (56 of 60 had India roles that day).
 * SmartRecruiters boards are limited to India (country: 'in'); roles abroad there have no description to show sponsorship.
 * Companies on other systems (Workday, Darwinbox, TurboHire, Kula, iCIMS…) aren't readable here; see docs/SOURCES.md.
 */
const boards: CatalogEntry[] = [
  { key: 'greenhouse:agoda', kind: 'greenhouse', name: 'Agoda', config: { board: 'agoda' } },
  { key: 'ashby:aiprise', kind: 'ashby', name: 'AiPrise', config: { board: 'aiprise' } },
  { key: 'greenhouse:airbnb', kind: 'greenhouse', name: 'Airbnb', config: { board: 'airbnb' } },
  { key: 'greenhouse:anthropic', kind: 'greenhouse', name: 'Anthropic', config: { board: 'anthropic' } },
  { key: 'greenhouse:arcesiumllc', kind: 'greenhouse', name: 'Arcesium', config: { board: 'arcesiumllc' } },
  { key: 'ashby:atlan', kind: 'ashby', name: 'Atlan', config: { board: 'atlan' } },
  { key: 'smartrecruiters:canva', kind: 'smartrecruiters', name: 'Canva', config: { company: 'canva', country: 'in' } },
  { key: 'greenhouse:cloudflare', kind: 'greenhouse', name: 'Cloudflare', config: { board: 'cloudflare' } },
  { key: 'greenhouse:coinbase', kind: 'greenhouse', name: 'Coinbase', config: { board: 'coinbase' } },
  { key: 'ashby:composio', kind: 'ashby', name: 'Composio', config: { board: 'composio' } },
  { key: 'greenhouse:coursera', kind: 'greenhouse', name: 'Coursera', config: { board: 'coursera' } },
  { key: 'lever:cred', kind: 'lever', name: 'CRED', config: { site: 'cred' } },
  { key: 'greenhouse:databricks', kind: 'greenhouse', name: 'Databricks', config: { board: 'databricks' } },
  { key: 'greenhouse:doordashusa', kind: 'greenhouse', name: 'DoorDash', config: { board: 'doordashusa' } },
  { key: 'greenhouse:druva', kind: 'greenhouse', name: 'Druva', config: { board: 'druva' } },
  { key: 'greenhouse:elastic', kind: 'greenhouse', name: 'Elastic', config: { board: 'elastic' } },
  { key: 'greenhouse:emergentlabsinc', kind: 'greenhouse', name: 'Emergent', config: { board: 'emergentlabsinc' } },
  { key: 'lever:fampay', kind: 'lever', name: 'FamPay', config: { site: 'fampay' } },
  { key: 'greenhouse:figma', kind: 'greenhouse', name: 'Figma', config: { board: 'figma' } },
  {
    key: 'smartrecruiters:freshworks',
    kind: 'smartrecruiters',
    name: 'Freshworks',
    config: { company: 'freshworks', country: 'in' },
  },
  { key: 'greenhouse:gitlab', kind: 'greenhouse', name: 'GitLab', config: { board: 'gitlab' } },
  { key: 'greenhouse:gleanwork', kind: 'greenhouse', name: 'Glean', config: { board: 'gleanwork' } },
  { key: 'greenhouse:grafanalabs', kind: 'greenhouse', name: 'Grafana Labs', config: { board: 'grafanalabs' } },
  {
    key: 'greenhouse:gravitonresearchcapital',
    kind: 'greenhouse',
    name: 'Graviton Research Capital',
    config: { board: 'gravitonresearchcapital' },
  },
  { key: 'greenhouse:groww', kind: 'greenhouse', name: 'Groww', config: { board: 'groww' } },
  { key: 'greenhouse:hackerrank', kind: 'greenhouse', name: 'HackerRank', config: { board: 'hackerrank' } },
  { key: 'greenhouse:harnessinc', kind: 'greenhouse', name: 'Harness', config: { board: 'harnessinc' } },
  { key: 'lever:hevodata', kind: 'lever', name: 'Hevo Data', config: { site: 'hevodata' } },
  { key: 'greenhouse:inmobi', kind: 'greenhouse', name: 'InMobi', config: { board: 'inmobi' } },
  { key: 'smartrecruiters:ixigo', kind: 'smartrecruiters', name: 'ixigo', config: { company: 'ixigo', country: 'in' } },
  { key: 'lever:meesho', kind: 'lever', name: 'Meesho', config: { site: 'meesho' } },
  { key: 'lever:mindtickle', kind: 'lever', name: 'Mindtickle', config: { site: 'mindtickle' } },
  { key: 'greenhouse:mongodb', kind: 'greenhouse', name: 'MongoDB', config: { board: 'mongodb' } },
  { key: 'lever:netomi', kind: 'lever', name: 'Netomi', config: { site: 'netomi' } },
  { key: 'greenhouse:newrelic', kind: 'greenhouse', name: 'New Relic', config: { board: 'newrelic' } },
  { key: 'ashby:notion', kind: 'ashby', name: 'Notion', config: { board: 'notion' } },
  { key: 'greenhouse:observeai', kind: 'greenhouse', name: 'Observe.AI', config: { board: 'observeai' } },
  { key: 'greenhouse:okta', kind: 'greenhouse', name: 'Okta', config: { board: 'okta' } },
  { key: 'ashby:openai', kind: 'ashby', name: 'OpenAI', config: { board: 'openai' } },
  { key: 'greenhouse:optiverus', kind: 'greenhouse', name: 'Optiver', config: { board: 'optiverus' } },
  { key: 'ashby:perplexity', kind: 'ashby', name: 'Perplexity', config: { board: 'perplexity' } },
  { key: 'lever:pocketfm', kind: 'lever', name: 'Pocket FM', config: { site: 'pocketfm' } },
  {
    key: 'greenhouse:razorpaysoftwareprivatelimited',
    kind: 'greenhouse',
    name: 'Razorpay',
    config: { board: 'razorpaysoftwareprivatelimited' },
  },
  { key: 'greenhouse:rubrik', kind: 'greenhouse', name: 'Rubrik', config: { board: 'rubrik' } },
  { key: 'ashby:sarvam', kind: 'ashby', name: 'Sarvam AI', config: { board: 'sarvam' } },
  { key: 'greenhouse:scaleai', kind: 'greenhouse', name: 'Scale AI', config: { board: 'scaleai' } },
  {
    key: 'smartrecruiters:servicenow',
    kind: 'smartrecruiters',
    name: 'ServiceNow',
    config: { company: 'servicenow', country: 'in' },
  },
  { key: 'ashby:signoz', kind: 'ashby', name: 'SigNoz', config: { board: 'signoz' } },
  { key: 'ashby:snowflake', kind: 'ashby', name: 'Snowflake', config: { board: 'snowflake' } },
  { key: 'ashby:spotdraft', kind: 'ashby', name: 'SpotDraft', config: { board: 'spotdraft' } },
  { key: 'greenhouse:stripe', kind: 'greenhouse', name: 'Stripe', config: { board: 'stripe' } },
  {
    key: 'smartrecruiters:swiggy',
    kind: 'smartrecruiters',
    name: 'Swiggy',
    config: { company: 'swiggy', country: 'in' },
  },
  { key: 'ashby:tekion', kind: 'ashby', name: 'Tekion', config: { board: 'tekion' } },
  { key: 'greenhouse:thoughtworks', kind: 'greenhouse', name: 'Thoughtworks', config: { board: 'thoughtworks' } },
  {
    key: 'greenhouse:towerresearchcapital',
    kind: 'greenhouse',
    name: 'Tower Research Capital',
    config: { board: 'towerresearchcapital' },
  },
  { key: 'greenhouse:turing', kind: 'greenhouse', name: 'Turing', config: { board: 'turing' } },
  { key: 'greenhouse:twilio', kind: 'greenhouse', name: 'Twilio', config: { board: 'twilio' } },
  { key: 'smartrecruiters:wise', kind: 'smartrecruiters', name: 'Wise', config: { company: 'wise', country: 'in' } },
  { key: 'lever:zeta', kind: 'lever', name: 'Zeta', config: { site: 'zeta' } },
  { key: 'greenhouse:zscaler', kind: 'greenhouse', name: 'Zscaler', config: { board: 'zscaler' } },
]

export const catalog: CatalogEntry[] = [...aggregated, ...boards]
