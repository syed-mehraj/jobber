import type { CatalogEntry } from './catalog'

/**
 * Companies outside India that hire internationally (visa sponsorship / relocation). Every board was verified
 * against its ATS's public API and has at least one tech role in a target country. Comment = main country and
 * city, plus how many sampled tech roles mention visa sponsorship or relocation in their description.
 */
export const internationalCatalog: CatalogEntry[] = [
  // DE Heidelberg · no visa/relocation mention in 4 sampled tech roles
  { key: 'ashby:alephalpha', kind: 'ashby', name: 'Aleph Alpha', config: { board: 'alephalpha' } },
  // DE Berlin · no visa/relocation mention in 2 sampled tech roles
  { key: 'smartrecruiters:auto1', kind: 'smartrecruiters', name: 'AUTO1 Group', config: { company: 'auto1' } },
  // DE Berlin · no visa/relocation mention in 7 sampled tech roles
  { key: 'ashby:babbel', kind: 'ashby', name: 'Babbel', config: { board: 'babbel' } },
  // DE Freiburg · mentions relocation in 1 of 6 sampled tech roles
  { key: 'ashby:black-forest-labs', kind: 'ashby', name: 'Black Forest Labs', config: { board: 'black-forest-labs' } },
  // DE Munich · mentions visa sponsorship in 4, relocation in 9 of 25 sampled tech roles
  { key: 'greenhouse:celonis', kind: 'greenhouse', name: 'Celonis', config: { board: 'celonis' } },
  // DE Munich · no visa/relocation mention in 16 sampled tech roles
  { key: 'greenhouse:commercetools', kind: 'greenhouse', name: 'commercetools', config: { board: 'commercetools' } },
  // DE Berlin · no visa/relocation mention in 3 sampled tech roles
  { key: 'greenhouse:contentful', kind: 'greenhouse', name: 'Contentful', config: { board: 'contentful' } },
  // DE Cologne · no visa/relocation mention in 4 sampled tech roles
  { key: 'ashby:deepl', kind: 'ashby', name: 'DeepL', config: { board: 'deepl' } },
  // DE Berlin · mentions relocation in 8 of 20 sampled tech roles
  { key: 'ashby:doctolib', kind: 'ashby', name: 'Doctolib', config: { board: 'doctolib' } },
  // DE Berlin · mentions relocation in 2 of 3 sampled tech roles
  { key: 'ashby:enpal', kind: 'ashby', name: 'Enpal', config: { board: 'enpal' } },
  // DE Munich · no visa/relocation mention in 24 sampled tech roles
  { key: 'greenhouse:flix', kind: 'greenhouse', name: 'FlixBus', config: { board: 'flix' } },
  // DE Berlin · no visa/relocation mention in 18 sampled tech roles
  { key: 'ashby:getyourguide', kind: 'ashby', name: 'GetYourGuide', config: { board: 'getyourguide' } },
  // DE Berlin · no visa/relocation mention in 1 sampled tech roles
  { key: 'greenhouse:grover', kind: 'greenhouse', name: 'Grover', config: { board: 'grover' } },
  // DE Berlin · mentions relocation in 2 of 25 sampled tech roles
  { key: 'greenhouse:hellofresh', kind: 'greenhouse', name: 'HelloFresh', config: { board: 'hellofresh' } },
  // DE Munich · mentions relocation in 22 of 25 sampled tech roles
  { key: 'greenhouse:helsing', kind: 'greenhouse', name: 'Helsing', config: { board: 'helsing' } },
  // DE Munich · mentions relocation in 6 of 25 sampled tech roles
  { key: 'greenhouse:isaraerospace', kind: 'greenhouse', name: 'Isar Aerospace', config: { board: 'isaraerospace' } },
  // DE Berlin · mentions visa sponsorship in 5, relocation in 5 of 5 sampled tech roles
  { key: 'greenhouse:n26', kind: 'greenhouse', name: 'N26', config: { board: 'n26' } },
  // DE Berlin · mentions visa sponsorship in 11 of 11 sampled tech roles
  { key: 'ashby:n8n', kind: 'ashby', name: 'n8n', config: { board: 'n8n' } },
  // DE Berlin · mentions relocation in 1 of 1 sampled tech roles
  { key: 'smartrecruiters:omio', kind: 'smartrecruiters', name: 'Omio', config: { company: 'omio' } },
  // DE Berlin · no visa/relocation mention in 14 sampled tech roles
  { key: 'ashby:parloa', kind: 'ashby', name: 'Parloa', config: { board: 'parloa' } },
  // DE Berlin · mentions relocation in 2 of 2 sampled tech roles
  { key: 'greenhouse:raisin', kind: 'greenhouse', name: 'Raisin', config: { board: 'raisin' } },
  // DE Munich · mentions relocation in 19 of 25 sampled tech roles
  {
    key: 'smartrecruiters:scalablegmbh',
    kind: 'smartrecruiters',
    name: 'Scalable Capital',
    config: { company: 'scalablegmbh' },
  },
  // DE Berlin · no visa/relocation mention in 9 sampled tech roles
  { key: 'greenhouse:solarisbank', kind: 'greenhouse', name: 'Solaris', config: { board: 'solarisbank' } },
  // DE Chemnitz · no visa/relocation mention in 10 sampled tech roles
  { key: 'greenhouse:staffbase', kind: 'greenhouse', name: 'Staffbase', config: { board: 'staffbase' } },
  // NL Amsterdam · no visa/relocation mention in 6 sampled tech roles
  { key: 'ashby:bitvavo', kind: 'ashby', name: 'Bitvavo', config: { board: 'bitvavo' } },
  // NL Utrecht · no visa/relocation mention in 3 sampled tech roles
  { key: 'greenhouse:bolcom', kind: 'greenhouse', name: 'bol', config: { board: 'bolcom' } },
  // NL Amsterdam · mentions visa sponsorship in 3, relocation in 3 of 7 sampled tech roles
  { key: 'greenhouse:catawiki', kind: 'greenhouse', name: 'Catawiki', config: { board: 'catawiki' } },
  // NL Amsterdam · mentions relocation in 1 of 5 sampled tech roles
  { key: 'ashby:mollie', kind: 'ashby', name: 'Mollie', config: { board: 'mollie' } },
  // CH Lausanne · mentions visa sponsorship in 2, relocation in 2 of 11 sampled tech roles
  { key: 'ashby:neuralconcept', kind: 'ashby', name: 'Neural Concept', config: { board: 'neuralconcept' } },
  // CH Lausanne · mentions relocation in 8 of 12 sampled tech roles
  { key: 'smartrecruiters:nexthink', kind: 'smartrecruiters', name: 'Nexthink', config: { company: 'nexthink' } },
  // CH Geneva · no visa/relocation mention in 4 sampled tech roles
  { key: 'greenhouse:proton', kind: 'greenhouse', name: 'Proton', config: { board: 'proton' } },
  // CH Zurich · no visa/relocation mention in 6 sampled tech roles
  { key: 'greenhouse:scandit', kind: 'greenhouse', name: 'Scandit', config: { board: 'scandit' } },
  // CH Baar · mentions visa sponsorship in 1 of 25 sampled tech roles
  { key: 'greenhouse:veeamsoftware', kind: 'greenhouse', name: 'Veeam', config: { board: 'veeamsoftware' } },
  // IE Dublin · mentions relocation in 3 of 25 sampled tech roles
  { key: 'greenhouse:intercom', kind: 'greenhouse', name: 'Intercom', config: { board: 'intercom' } },
  // IE Dublin · no visa/relocation mention in 1 sampled tech roles
  { key: 'ashby:wayflyer', kind: 'ashby', name: 'Wayflyer', config: { board: 'wayflyer' } },
  // IE Dublin · no visa/relocation mention in 1 sampled tech roles
  { key: 'ashby:workhuman', kind: 'ashby', name: 'Workhuman', config: { board: 'workhuman' } },
  // GB London · no visa/relocation mention in 25 sampled tech roles
  { key: 'ashby:checkout.com', kind: 'ashby', name: 'Checkout.com', config: { board: 'checkout.com' } },
  // GB London · mentions visa sponsorship in 1, relocation in 1 of 25 sampled tech roles
  { key: 'greenhouse:deliveroo', kind: 'greenhouse', name: 'Deliveroo', config: { board: 'deliveroo' } },
  // GB London · no visa/relocation mention in 25 sampled tech roles
  { key: 'ashby:faculty', kind: 'ashby', name: 'Faculty', config: { board: 'faculty' } },
  // GB London · no visa/relocation mention in 7 sampled tech roles
  { key: 'greenhouse:gocardless', kind: 'greenhouse', name: 'GoCardless', config: { board: 'gocardless' } },
  // GB Bristol · mentions visa sponsorship in 24 of 25 sampled tech roles
  { key: 'greenhouse:graphcore', kind: 'greenhouse', name: 'Graphcore', config: { board: 'graphcore' } },
  // GB London · no visa/relocation mention in 1 sampled tech roles
  { key: 'ashby:improbable', kind: 'ashby', name: 'Improbable', config: { board: 'improbable' } },
  // GB London · no visa/relocation mention in 25 sampled tech roles
  {
    key: 'greenhouse:isomorphiclabs',
    kind: 'greenhouse',
    name: 'Isomorphic Labs',
    config: { board: 'isomorphiclabs' },
  },
  // GB London · mentions relocation in 5 of 5 sampled tech roles
  { key: 'greenhouse:mewssystems', kind: 'greenhouse', name: 'Mews', config: { board: 'mewssystems' } },
  // GB London · mentions relocation in 25 of 25 sampled tech roles
  { key: 'ashby:mistral.ai', kind: 'ashby', name: 'Mistral AI', config: { board: 'mistral.ai' } },
  // GB London · mentions visa sponsorship in 11, relocation in 11 of 18 sampled tech roles
  { key: 'greenhouse:monzo', kind: 'greenhouse', name: 'Monzo', config: { board: 'monzo' } },
  // GB London · no visa/relocation mention in 1 sampled tech roles
  { key: 'ashby:oaknorth', kind: 'ashby', name: 'OakNorth', config: { board: 'oaknorth' } },
  // GB London · no visa/relocation mention in 4 sampled tech roles
  { key: 'ashby:paddle', kind: 'ashby', name: 'Paddle', config: { board: 'paddle' } },
  // GB London · no visa/relocation mention in 25 sampled tech roles
  { key: 'greenhouse:physicsx', kind: 'greenhouse', name: 'PhysicsX', config: { board: 'physicsx' } },
  // GB London · no visa/relocation mention in 7 sampled tech roles
  { key: 'ashby:quantexa', kind: 'ashby', name: 'Quantexa', config: { board: 'quantexa' } },
  // GB London · no visa/relocation mention in 6 sampled tech roles
  { key: 'ashby:snyk', kind: 'ashby', name: 'Snyk', config: { board: 'snyk' } },
  // GB London · mentions visa sponsorship in 1, relocation in 4 of 17 sampled tech roles
  { key: 'greenhouse:sumup', kind: 'greenhouse', name: 'SumUp', config: { board: 'sumup' } },
  // GB London · no visa/relocation mention in 4 sampled tech roles
  { key: 'ashby:synthesia', kind: 'ashby', name: 'Synthesia', config: { board: 'synthesia' } },
  // GB London · no visa/relocation mention in 24 sampled tech roles
  { key: 'ashby:thought-machine', kind: 'ashby', name: 'Thought Machine', config: { board: 'thought-machine' } },
  // GB London · no visa/relocation mention in 7 sampled tech roles
  { key: 'greenhouse:tide', kind: 'greenhouse', name: 'Tide', config: { board: 'tide' } },
  // GB London · mentions visa sponsorship in 24, relocation in 24 of 25 sampled tech roles
  { key: 'ashby:wayve', kind: 'ashby', name: 'Wayve', config: { board: 'wayve' } },
  // GB London · no visa/relocation mention in 14 sampled tech roles
  { key: 'lever:zopa', kind: 'lever', name: 'Zopa', config: { site: 'zopa' } },
  // AU Sydney · no visa/relocation mention in 1 sampled tech roles
  { key: 'ashby:airtasker', kind: 'ashby', name: 'Airtasker', config: { board: 'airtasker' } },
  // AU Melbourne · no visa/relocation mention in 4 sampled tech roles
  { key: 'lever:blinq', kind: 'lever', name: 'Blinq', config: { site: 'blinq' } },
  // AU Melbourne · no visa/relocation mention in 2 sampled tech roles
  { key: 'greenhouse:cultureamp', kind: 'greenhouse', name: 'Culture Amp', config: { board: 'cultureamp' } },
  // AU Sydney · no visa/relocation mention in 1 sampled tech roles
  { key: 'lever:immutable', kind: 'lever', name: 'Immutable', config: { site: 'immutable' } },
  // AU Sydney · no visa/relocation mention in 6 sampled tech roles
  { key: 'lever:mable', kind: 'lever', name: 'Mable', config: { site: 'mable' } },
  // AU Brisbane · no visa/relocation mention in 13 sampled tech roles
  { key: 'lever:megaport', kind: 'lever', name: 'Megaport', config: { site: 'megaport' } },
  // AU Melbourne · no visa/relocation mention in 2 sampled tech roles
  { key: 'smartrecruiters:seek', kind: 'smartrecruiters', name: 'SEEK', config: { company: 'seek' } },
  // AU Melbourne · mentions relocation in 3 of 25 sampled tech roles
  { key: 'ashby:xero', kind: 'ashby', name: 'Xero', config: { board: 'xero' } },
  // CA Toronto · no visa/relocation mention in 25 sampled tech roles
  { key: 'ashby:1password', kind: 'ashby', name: '1Password', config: { board: '1password' } },
  // CA Toronto · mentions relocation in 1 of 25 sampled tech roles
  { key: 'ashby:cohere', kind: 'ashby', name: 'Cohere', config: { board: 'cohere' } },
  // CA Kitchener · no visa/relocation mention in 3 sampled tech roles
  { key: 'greenhouse:d2l', kind: 'greenhouse', name: 'D2L', config: { board: 'd2l' } },
  // CA Toronto · no visa/relocation mention in 4 sampled tech roles
  { key: 'ashby:float', kind: 'ashby', name: 'Float', config: { board: 'float' } },
  // CA Ottawa · no visa/relocation mention in 6 sampled tech roles
  { key: 'lever:fullscript', kind: 'lever', name: 'Fullscript', config: { site: 'fullscript' } },
  // CA Vancouver · no visa/relocation mention in 2 sampled tech roles
  { key: 'smartrecruiters:hootsuite', kind: 'smartrecruiters', name: 'Hootsuite', config: { company: 'hootsuite' } },
  // CA Edmonton · no visa/relocation mention in 13 sampled tech roles
  { key: 'ashby:jobber', kind: 'ashby', name: 'Jobber', config: { board: 'jobber' } },
  // CA Montreal · no visa/relocation mention in 14 sampled tech roles
  { key: 'ashby:lightspeedhq', kind: 'ashby', name: 'Lightspeed Commerce', config: { board: 'lightspeedhq' } },
  // CA Calgary · mentions relocation in 2 of 3 sampled tech roles
  { key: 'ashby:neofinancial', kind: 'ashby', name: 'Neo Financial', config: { board: 'neofinancial' } },
  // CA Vancouver · no visa/relocation mention in 2 sampled tech roles
  { key: 'ashby:procurify', kind: 'ashby', name: 'Procurify', config: { board: 'procurify' } },
  // CA Vancouver · no visa/relocation mention in 4 sampled tech roles
  { key: 'lever:quandri', kind: 'lever', name: 'Quandri', config: { site: 'quandri' } },
  // CA Vancouver · no visa/relocation mention in 1 sampled tech roles
  { key: 'ashby:thinkific', kind: 'ashby', name: 'Thinkific', config: { board: 'thinkific' } },
  // CA Vancouver · no visa/relocation mention in 2 sampled tech roles
  { key: 'ashby:visier', kind: 'ashby', name: 'Visier', config: { board: 'visier' } },
  // CA Toronto · no visa/relocation mention in 9 sampled tech roles
  { key: 'ashby:wealthsimple', kind: 'ashby', name: 'Wealthsimple', config: { board: 'wealthsimple' } },
  // AE Dubai · mentions relocation in 1 of 21 sampled tech roles
  { key: 'greenhouse:bybit', kind: 'greenhouse', name: 'Bybit', config: { board: 'bybit' } },
  // AE Dubai · mentions relocation in 6 of 6 sampled tech roles
  { key: 'ashby:ziina', kind: 'ashby', name: 'Ziina', config: { board: 'ziina' } },
  // SA Riyadh · no visa/relocation mention in 4 sampled tech roles
  { key: 'ashby:leantech', kind: 'ashby', name: 'Lean Technologies', config: { board: 'leantech' } },
  // SA Riyadh · no visa/relocation mention in 2 sampled tech roles
  { key: 'greenhouse:tamara', kind: 'greenhouse', name: 'Tamara', config: { board: 'tamara' } },
  // SG Singapore · no visa/relocation mention in 25 sampled tech roles
  { key: 'greenhouse:binance', kind: 'greenhouse', name: 'Binance', config: { board: 'binance' } },
  // SG Singapore · no visa/relocation mention in 1 sampled tech roles
  {
    key: 'smartrecruiters:carousellgroup',
    kind: 'smartrecruiters',
    name: 'Carousell Group',
    config: { company: 'carousellgroup' },
  },
  // SG Singapore · no visa/relocation mention in 7 sampled tech roles
  { key: 'lever:shopback-2', kind: 'lever', name: 'ShopBack', config: { site: 'shopback-2' } },
  // SG Singapore · no visa/relocation mention in 12 sampled tech roles
  { key: 'greenhouse:thunes', kind: 'greenhouse', name: 'Thunes', config: { board: 'thunes' } },
  // SG Singapore · no visa/relocation mention in 3 sampled tech roles
  { key: 'greenhouse:xendit', kind: 'greenhouse', name: 'Xendit', config: { board: 'xendit' } },
  // JP Tokyo · mentions visa sponsorship in 15, relocation in 15 of 21 sampled tech roles
  { key: 'greenhouse:paypay', kind: 'greenhouse', name: 'PayPay', config: { board: 'paypay' } },
  // JP Tokyo · no visa/relocation mention in 25 sampled tech roles
  { key: 'lever:woven-by-toyota', kind: 'lever', name: 'Woven by Toyota', config: { site: 'woven-by-toyota' } },
  // SE Stockholm · no visa/relocation mention in 10 sampled tech roles
  { key: 'ashby:epidemic-sound', kind: 'ashby', name: 'Epidemic Sound', config: { board: 'epidemic-sound' } },
  // SE Stockholm · no visa/relocation mention in 25 sampled tech roles
  { key: 'ashby:legora', kind: 'ashby', name: 'Legora', config: { board: 'legora' } },
  // SE Stockholm · mentions relocation in 4 of 25 sampled tech roles
  { key: 'ashby:lovable', kind: 'ashby', name: 'Lovable', config: { board: 'lovable' } },
  // SE Stockholm · no visa/relocation mention in 12 sampled tech roles
  { key: 'greenhouse:truecaller', kind: 'greenhouse', name: 'Truecaller', config: { board: 'truecaller' } },
  // DK Copenhagen · mentions visa sponsorship in 1 of 4 sampled tech roles
  { key: 'ashby:pleo', kind: 'ashby', name: 'Pleo', config: { board: 'pleo' } },
  // FI Espoo · mentions relocation in 2 of 25 sampled tech roles
  { key: 'ashby:iceye', kind: 'ashby', name: 'ICEYE', config: { board: 'iceye' } },
  // FI Oulu · no visa/relocation mention in 25 sampled tech roles
  { key: 'greenhouse:oura', kind: 'greenhouse', name: 'Oura', config: { board: 'oura' } },
  // FI Helsinki · mentions relocation in 1 of 12 sampled tech roles
  { key: 'greenhouse:relex', kind: 'greenhouse', name: 'RELEX Solutions', config: { board: 'relex' } },
  // FI Helsinki · no visa/relocation mention in 25 sampled tech roles
  { key: 'greenhouse:smartlyio', kind: 'greenhouse', name: 'Smartly.io', config: { board: 'smartlyio' } },
  // FI Helsinki · mentions relocation in 8 of 8 sampled tech roles
  { key: 'ashby:supercell', kind: 'ashby', name: 'Supercell', config: { board: 'supercell' } },
  // FI Helsinki · mentions visa sponsorship in 1, relocation in 1 of 16 sampled tech roles
  { key: 'greenhouse:wolt', kind: 'greenhouse', name: 'Wolt', config: { board: 'wolt' } },
  // NO Oslo · mentions relocation in 1 of 17 sampled tech roles
  { key: 'greenhouse:cognite', kind: 'greenhouse', name: 'Cognite', config: { board: 'cognite' } },
  // AT Vienna · mentions relocation in 4 of 14 sampled tech roles
  { key: 'greenhouse:bitpanda', kind: 'greenhouse', name: 'Bitpanda', config: { board: 'bitpanda' } },
  // AT Vienna · no visa/relocation mention in 3 sampled tech roles
  { key: 'greenhouse:gostudent', kind: 'greenhouse', name: 'GoStudent', config: { board: 'gostudent' } },
  // LU Luxembourg · mentions relocation in 2 of 2 sampled tech roles
  { key: 'ashby:satispay', kind: 'ashby', name: 'Satispay', config: { board: 'satispay' } },
  // EE Tallinn · no visa/relocation mention in 12 sampled tech roles
  { key: 'smartrecruiters:playtech', kind: 'smartrecruiters', name: 'Playtech', config: { company: 'playtech' } },
  // EE Tallinn · mentions relocation in 1 of 2 sampled tech roles
  { key: 'greenhouse:veriff', kind: 'greenhouse', name: 'Veriff', config: { board: 'veriff' } },
  // PT Porto · no visa/relocation mention in 14 sampled tech roles
  { key: 'ashby:farfetch', kind: 'ashby', name: 'Farfetch', config: { board: 'farfetch' } },
  // PT Lisbon · no visa/relocation mention in 1 sampled tech roles
  { key: 'greenhouse:feedzai', kind: 'greenhouse', name: 'Feedzai', config: { board: 'feedzai' } },
  // PT Porto · no visa/relocation mention in 8 sampled tech roles
  { key: 'greenhouse:swordhealth', kind: 'greenhouse', name: 'Sword Health', config: { board: 'swordhealth' } },
  // PL Warsaw · mentions visa sponsorship in 1, relocation in 2 of 12 sampled tech roles
  { key: 'ashby:docplanner', kind: 'ashby', name: 'Docplanner', config: { board: 'docplanner' } },
  // ES Madrid · mentions relocation in 1 of 2 sampled tech roles
  { key: 'greenhouse:cabify', kind: 'greenhouse', name: 'Cabify', config: { board: 'cabify' } },
  // ES Barcelona · mentions relocation in 25 of 25 sampled tech roles
  { key: 'ashby:perk', kind: 'ashby', name: 'Perk (TravelPerk)', config: { board: 'perk' } },
  // ES Barcelona · no visa/relocation mention in 2 sampled tech roles
  { key: 'greenhouse:typeform', kind: 'greenhouse', name: 'Typeform', config: { board: 'typeform' } },
  // ES Barcelona · mentions visa sponsorship in 1, relocation in 1 of 1 sampled tech roles
  { key: 'greenhouse:wallapop', kind: 'greenhouse', name: 'Wallapop', config: { board: 'wallapop' } },
  // US San Francisco · no visa/relocation mention in 6 sampled tech roles
  { key: 'greenhouse:assemblyai', kind: 'greenhouse', name: 'AssemblyAI', config: { board: 'assemblyai' } },
  // US Sunnyvale · no visa/relocation mention in 25 sampled tech roles
  { key: 'ashby:cerebras', kind: 'ashby', name: 'Cerebras', config: { board: 'cerebras' } },
  // US Redwood City · no visa/relocation mention in 11 sampled tech roles
  { key: 'ashby:character', kind: 'ashby', name: 'Character.AI', config: { board: 'character' } },
  // US San Francisco · no visa/relocation mention in 25 sampled tech roles
  { key: 'ashby:cognition', kind: 'ashby', name: 'Cognition', config: { board: 'cognition' } },
  // US Remote · no visa/relocation mention in 2 sampled tech roles
  { key: 'greenhouse:consensys', kind: 'greenhouse', name: 'Consensys', config: { board: 'consensys' } },
  // US San Francisco · no visa/relocation mention in 23 sampled tech roles
  { key: 'ashby:deepgram', kind: 'ashby', name: 'Deepgram', config: { board: 'deepgram' } },
  // US New York · no visa/relocation mention in 25 sampled tech roles
  { key: 'ashby:elevenlabs', kind: 'ashby', name: 'ElevenLabs', config: { board: 'elevenlabs' } },
  // US San Francisco · no visa/relocation mention in 25 sampled tech roles
  { key: 'greenhouse:faire', kind: 'greenhouse', name: 'Faire', config: { board: 'faire' } },
  // US New York · no visa/relocation mention in 12 sampled tech roles
  { key: 'ashby:glia', kind: 'ashby', name: 'Glia', config: { board: 'glia' } },
  // US San Francisco · no visa/relocation mention in 25 sampled tech roles
  { key: 'ashby:lambda', kind: 'ashby', name: 'Lambda', config: { board: 'lambda' } },
  // US San Francisco · no visa/relocation mention in 25 sampled tech roles
  { key: 'ashby:langchain', kind: 'ashby', name: 'LangChain', config: { board: 'langchain' } },
  // US San Francisco · no visa/relocation mention in 2 sampled tech roles
  { key: 'ashby:miro', kind: 'ashby', name: 'Miro', config: { board: 'miro' } },
  // US New York · no visa/relocation mention in 19 sampled tech roles
  { key: 'ashby:modal', kind: 'ashby', name: 'Modal', config: { board: 'modal' } },
  // US Austin · no visa/relocation mention in 15 sampled tech roles
  { key: 'lever:mythic-ai.com', kind: 'lever', name: 'Mythic', config: { site: 'mythic-ai.com' } },
  // US San Mateo · mentions visa sponsorship in 1 of 25 sampled tech roles
  { key: 'greenhouse:neo4j', kind: 'greenhouse', name: 'Neo4j', config: { board: 'neo4j' } },
  // US New York · no visa/relocation mention in 4 sampled tech roles
  { key: 'ashby:pinecone', kind: 'ashby', name: 'Pinecone', config: { board: 'pinecone' } },
  // US Foster City · no visa/relocation mention in 19 sampled tech roles
  { key: 'ashby:replit', kind: 'ashby', name: 'Replit', config: { board: 'replit' } },
  // US New York · no visa/relocation mention in 3 sampled tech roles
  { key: 'ashby:runway', kind: 'ashby', name: 'Runway', config: { board: 'runway' } },
  // US San Francisco · no visa/relocation mention in 25 sampled tech roles
  { key: 'greenhouse:togetherai', kind: 'greenhouse', name: 'Together AI', config: { board: 'togetherai' } },
  // US Los Altos · no visa/relocation mention in 25 sampled tech roles
  { key: 'lever:tri', kind: 'lever', name: 'Toyota Research Institute', config: { site: 'tri' } },
]
