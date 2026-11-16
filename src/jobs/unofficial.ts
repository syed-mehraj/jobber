/** Source kinds that read big-tech careers sites without a published feed. Marked "unofficial" in the UI. */
export const UNOFFICIAL_KINDS = new Set(['amazon', 'eightfold', 'google'])

export function isUnofficial(kind: string): boolean {
  return UNOFFICIAL_KINDS.has(kind)
}
