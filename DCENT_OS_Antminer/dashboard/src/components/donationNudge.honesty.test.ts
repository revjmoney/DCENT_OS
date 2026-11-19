// C6 (2026-09-01) donation-nudge honesty gate.
//
// JMSCNC Heater OS: donation defaults ON at 1%, one tap off. This gate pins
// the copy contract of every customer-facing donation surface so the nudge
// can never regress into the old CLAIM_UNSAFE claims or pressure patterns:
//   • no "pays for itself" / autotuner-offsets-the-donation claim
//     (CLAIM_UNSAFE row in DCENT_OS_Antminer/docs/COMPETITIVE_FEATURE_MATRIX.md);
//   • no countdown / scarcity / pressure wording;
//   • the 1% default and the one-tap off are stated honestly on the surfaces;
//   • the canonical fund link is on every donation surface;
//   • the dashboard default state is enabled @ 1% (mirrors DonationConfig,
//     JMSCNC Heater OS default) and pointed at the Mining Dutch account;
//   • the compact nudge is dismissible.
//
// Modeled on customerCopy.honesty.test.ts (source-scan, no DOM).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const COMPONENTS_DIR = join(process.cwd(), 'src/components');

const DONATION_SURFACES = [
  'common/DonationFeeCard.tsx',
  'wizard/DonationStep.tsx',
] as const;

function load(rel: string): string {
  return readFileSync(join(COMPONENTS_DIR, rel), 'utf8');
}

/** Strip comments so the truth-contract headers themselves (which NAME the
 * banned claims) don't trip the copy scan — same approach as
 * customerCopy.honesty.test.ts. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

// Pressure patterns a "polished, not naggy" nudge must never use.
// NOTE: the verbs are anchored directly after "autotuner" so the honest
// NEGATED disclaimer ("the autotuner does not pay this donation") stays
// legal while the affirmative claim stays banned.
const BANNED_PRESSURE_PATTERNS: RegExp[] = [
  /pays for itself/i,
  /pay(?:s|ing)? for the donation/i,
  /autotuner (?:saves|pays|offsets)/i,
  /last chance/i,
  /act now/i,
  /expires?/i,
  /limited time/i,
  /only \d+ (?:left|remaining|days|hours)/i,
  /before it(?:'s| is) too late/i,
  /don(?:'t| not) wait/i,
  /hurry/i,
  /please leave (?:it on|at least)/i,
  /revenue model/i,
];

describe('donation copy honesty (JMSCNC Heater OS 1% default posture)', () => {
  it('never claims the donation pays for itself or leans on pressure wording', () => {
    const offenders: string[] = [];
    for (const rel of DONATION_SURFACES) {
      const source = stripComments(load(rel));
      for (const pattern of BANNED_PRESSURE_PATTERNS) {
        if (pattern.test(source)) offenders.push(`${rel}: ${pattern}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('states the 1% default honestly and carries the canonical fund link on every donation surface', () => {
    for (const rel of DONATION_SURFACES) {
      const source = load(rel);
      const copy = stripComments(source);
      expect(copy, `${rel} must disclose the 1% default`).toMatch(/1% of hashing time/i);
      expect(copy, `${rel} must say it can be turned off`).toMatch(/turn (?:it|donation) off/i);
      // The old zero-fee claims are no longer true and must not come back.
      expect(copy, `${rel} must not claim no mandatory fee`).not.toMatch(/no mandatory fee/i);
      expect(copy, `${rel} must not claim a 0% fee`).not.toMatch(/0% fee/i);
      expect(source, `${rel} must import the canonical fund destination`).toMatch(/import \{ DCENT_FUND_CANONICAL_URL(?: as FUND_URL)? \} from '\.\.\/\.\.\/utils\/links'/);
      expect(source, `${rel} must use that destination`).toMatch(/href=\{(?:DCENT_FUND_CANONICAL_URL|FUND_URL)\}/);
    }
  });

  it('dashboard donation default state is enabled at 1 percent to Mining Dutch (mirrors DonationConfig)', () => {
    const card = load('common/DonationFeeCard.tsx');
    expect(card).toContain('const DEFAULT_PERCENT = 1');
    expect(card).toMatch(/enabled: true,\s*percent: DEFAULT_PERCENT/);
    expect(card).toContain("const DEFAULT_POOL_URL = 'stratum+tcp://americas.mining-dutch.nl:9996'");
    expect(card).toContain("const DEFAULT_WORKER = 'revjmoney.heateros'");
    expect(card).toMatch(/fallback_enabled: false/);
    // One-tap presets stay 1/2/3, plus a visible Turn off control.
    expect(card).toMatch(/\[1, 2, 3\]\.map/);
    expect(card).toContain('Turn off');

    const wizard = load('wizard/SetupWizard.tsx');
    expect(wizard).toContain('donation: { enabled: true, percent: DEFAULT_DONATION_PERCENT }');
    expect(wizard).toContain('const DEFAULT_DONATION_PERCENT = 1');
    expect(wizard).toContain('fallback_enabled: false');
    for (const src of [card, wizard]) {
      expect(src).not.toMatch(/DungeonMaster|pool\.d-central\.tech|stratum\.braiins\.com/);
    }
  });

  it('the compact nudge is dismissible without burying the Settings control surface', () => {
    const card = load('common/DonationFeeCard.tsx');
    expect(card).toContain('aria-label="Dismiss donation nudge"');
    // Dismissal persists locally and the full Settings variant stays mounted.
    expect(card).toContain("variant === 'compact'");
    expect(card).toContain("variant = 'full'");
  });

  it('the earnings take-rate helper defaults to the firmware 1 percent default', () => {
    const thermal = readFileSync(join(process.cwd(), 'src/utils/thermal.ts'), 'utf8');
    expect(thermal).toContain('export const DEFAULT_DONATION_PERCENT = 1');
    // Opted-in takes flow through — the helper must keep applying them.
    expect(thermal).toContain('config.enabled === false');
  });
});
