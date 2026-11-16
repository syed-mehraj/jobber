import type { CatalogEntry } from './catalog'

/**
 * UNOFFICIAL sources: big-tech careers sites that publish no feed. The app reads the same data their own
 * search pages load, for personal use only, at most once an hour (see UNOFFICIAL_KINDS in adapters/index.ts).
 * Chosen by the owner on 16 Nov 2026, accepting that these may break or be against the sites' terms.
 *
 * Not included: Flipkart (TurboHire needs an access token), Workday-based sites (Adobe, Nvidia, Salesforce,
 * PayPal, Intel, Walmart…) and Apple, Meta, Uber. They are linked on the Programs page.
 */
export const unofficialCatalog: CatalogEntry[] = [
  { key: 'unofficial:amazon', kind: 'amazon', name: 'Amazon', config: {} },
  { key: 'unofficial:google', kind: 'google', name: 'Google', config: {} },
  {
    key: 'unofficial:microsoft',
    kind: 'eightfold',
    name: 'Microsoft',
    config: { host: 'apply.careers.microsoft.com', domain: 'microsoft.com', company: 'Microsoft', flavor: 'pcsx' },
  },
  {
    key: 'unofficial:netflix',
    kind: 'eightfold',
    name: 'Netflix',
    config: { host: 'explore.jobs.netflix.net', domain: 'netflix.com', company: 'Netflix', flavor: 'v2' },
  },
]
