/** Shared destinations for every dashboard support surface. */
// JMSCNC Heater OS support link (Buy Me a Coffee). The exported names keep
// their upstream DCENT_* spelling so call sites and upstream merges stay easy.
export const DCENT_FUND_CANONICAL_URL = 'https://buymeacoffee.com/revjmoney';
export const DCENT_DOCS_URL = '/#/help';

/**
 * Support link for a given dashboard placement. Every placement goes to the
 * same canonical support page; `placement` is accepted so call sites stay
 * unchanged, but no tracking query string is appended.
 */
export function fundContributeUrl(_placement: string): string {
  return DCENT_FUND_CANONICAL_URL;
}
