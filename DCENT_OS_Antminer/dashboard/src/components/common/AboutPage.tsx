import { DCENT_DOCS_URL, fundContributeUrl } from '../../utils/links';
import React, { useEffect, useState } from 'react';
import { useMinerStore } from '../../store/miner';
import { api } from '../../api/client';
import { DcentOsLogo } from './DcentOsLogo';
import { DonationFeeCard } from './DonationFeeCard';
import { ApiCompatibilityManifestCard } from './ApiCompatibilityManifestCard';
import { NetworkInfoCard } from './NetworkInfoCard';
import { MinerTypeCard } from './MinerTypeCard';
import { BuildPanel } from './BuildPanel';
import { ReportProblem } from './ReportProblem';

// CC-2: neutral fallbacks. The previous S9-specific literals (Antminer S9 /
// BM1387 / Zynq-7010) would assert a specific WRONG identity on a non-S9 unit
// (e.g. an S19j Pro / S21) whenever both /api/system/info and the store are
// unavailable (the wedged-daemon case 's timeout fix targets). An
// unidentified unit must say "Unknown", never claim to be an S9.
const FALLBACK_VERSION = 'Unknown';
const FALLBACK_MODEL = 'Unknown';
const FALLBACK_CHIP = 'Unknown';
const FALLBACK_SOC = 'Unknown';

export function AboutPage() {
  const systemInfo = useMinerStore(s => s.systemInfo);
  const status = useMinerStore(s => s.status);

  const [apiInfo, setApiInfo] = useState<Record<string, string> | null>(null);

  // Attempt to fetch live system info from API
  useEffect(() => {
    api.getSystemInfo()
      .then((info) => {
        setApiInfo({
          version: info.version,
          model: info.model,
          chip_type: info.chip_type,
          board: info.board,
          soc: info.soc,
          hostname: info.hostname,
          mac: info.mac,
        });
      })
      .catch(() => {
        // API not available — use store data or hardcoded fallbacks
      });
  }, []);

  const version = apiInfo?.version ?? systemInfo?.version ?? status?.firmware_version ?? FALLBACK_VERSION;
  const model = apiInfo?.model ?? systemInfo?.model ?? FALLBACK_MODEL;
  const chipType = apiInfo?.chip_type ?? systemInfo?.chip_type ?? FALLBACK_CHIP;
  const board = apiInfo?.board ?? systemInfo?.board ?? '---';
  const soc = apiInfo?.soc ?? systemInfo?.soc ?? FALLBACK_SOC;
  const hostname = apiInfo?.hostname ?? systemInfo?.hostname ?? '';
  const mac = apiInfo?.mac ?? systemInfo?.mac ?? '';

  return (
    <div style={{ padding: '24px', maxWidth: 600 }}>
      <div style={{ marginBottom: 8 }}>
        <DcentOsLogo width={220} />
      </div>
      <div style={{
        fontSize: '0.85rem',
        color: 'var(--text-dim)',
        marginBottom: 24,
      }}>
        Custom Mining Firmware for Antminer Hardware
      </div>

      {/* Firmware Info */}
      <AboutCard title="Firmware">
        <InfoRow label="Version" value={`dcentrald v${version}`} accent />
        <InfoRow label="Distribution" value="JMSCNC Heater OS" />
        <InfoRow label="License" value="GPL-3.0, 100% Open Source" />
        {hostname && <InfoRow label="Hostname" value={hostname} />}
        {mac && <InfoRow label="MAC" value={mac} mono />}
      </AboutCard>

      <ApiCompatibilityManifestCard />
      <BuildPanel />
      <ReportProblem />

      {/* Hardware Info */}
      <AboutCard title="Hardware">
        <InfoRow label="Model" value={model} />
        <InfoRow label="ASIC Chip" value={chipType} />
        <InfoRow label="SoC" value={soc} />
        <InfoRow label="Board" value={board} />
      </AboutCard>

      {/* W11.12: Stock-CGI parity panel — network identity, hardware
          identity (concise pyasic-style bundle), and a redacted support
          bundle download. Backs `/api/network/info`, `/api/miner/type`,
          and `/api/log/backup`. Read-only; degrades gracefully when the
          daemon is unavailable. */}
      <NetworkInfoCard />

      {/* W13.D2: Hardware Identity card with PVT envelope row + grade chip
          (color-coded by tier), voltage/freq range, chip count, plus the
          voltage_fixed / inverted_curve / requires_apw12_plus tooltips. */}
      <MinerTypeCard />

      {/* Developer */}
      <AboutCard title="Developer">
        <div style={{ fontSize: '0.9rem', color: 'var(--text, #E8E8E8)', lineHeight: 1.8 }}>
          <div><strong style={{ color: 'var(--accent, #FAA500)' }}>JMSCNC Heater OS</strong></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Maintained by Rev. J. Money (JMSCNC). JMSCNC Heater OS is a fork of{' '}
            <a
              href="https://github.com/DCentralTech/JMSCNC Heater OS"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent, #FAA500)' }}
            >
              JMSCNC Heater OS
            </a>
            {' '}by D-Central Technologies.
          </div>
        </div>
      </AboutCard>

      {/* Donation */}
      <AboutCard title="Donation">
        <DonationFeeCard variant="compact" />
      </AboutCard>

      {/* W9.7 "Coming from VNish?" copy, revised for JMSCNC Heater OS: the
          donation is ON at 1% by default, visible, 0-5%, and fully
          disableable. It must stay factual and non-disparaging. The donation
          destination is disclosed at /api/donation/info. */}
      <AboutCard title="Coming from VNish?">
        <div style={{ fontSize: '0.85rem', color: 'var(--text, #E8E8E8)', lineHeight: 1.7 }}>
          VNish builds carry a{' '}
          <strong style={{ color: 'var(--accent, #FAA500)' }}>
            binary-baked developer fee (~2-3%)
          </strong>
          , per public reverse-engineering. JMSCNC Heater OS sends{' '}
          <strong>1% of hashing time</strong> to support development by
          default, clearly labelled and shown whenever it runs. You can lower
          it or turn it off at any time.
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 10, lineHeight: 1.65 }}>
          The donation pool and worker are disclosed at{' '}
          <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>/api/donation/info</code>.
        </div>
      </AboutCard>

      {/* Links */}
      <AboutCard title="Links">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AboutLink
            href="https://jmscnc.com"
            label="JMSCNC"
            description="jmscnc.com"
          />
          <AboutLink
            href={fundContributeUrl('settings')}
            label="Buy Me a Coffee"
            description="Support JMSCNC Heater OS"
          />
          <AboutLink
            href="https://soundcloud.com/revjmoney/proof-of-heat-whitepaper"
            label="Proof of Heat, Whitepaper Foreplay"
            description="Rev. J. Money on SoundCloud"
          />
          <AboutLink
            href={DCENT_DOCS_URL}
            label="Help"
            description="Quickstart, installation and troubleshooting, available on this miner"
          />
        </div>
      </AboutCard>

      {/* License */}
      <AboutCard title="License">
        <div style={{ fontSize: '0.85rem', color: 'var(--text, #E8E8E8)', lineHeight: 1.6 }}>
          JMSCNC Heater OS (a fork of DCENT_OS) is free and open-source software licensed under the
          {' '}<strong>GNU General Public License v3.0</strong> (GPL-3.0).
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 8 }}>
          You are free to use, modify, and distribute this firmware.
          Source code is available on{' '}
          <a
            href="https://github.com/revjmoney/jmscnc-heater-os-s19j"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent, #FAA500)' }}
          >
            GitHub
          </a>.
        </div>
      </AboutCard>

      {/* Open Source Acknowledgments */}
      <AboutCard title="Open Source" last>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
          DCENT_OS builds upon the work of many open-source projects:
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Rust / Tokio (MIT/Apache-2.0)</li>
            <li>Buildroot (GPL-2.0)</li>
            <li>Linux Kernel (GPL-2.0)</li>
            <li>React &amp; TypeScript (MIT)</li>
            <li>Zustand (MIT)</li>
            <li>Vite (MIT)</li>
            <li>Lightweight Charts (Apache-2.0)</li>
          </ul>
          <div style={{ marginTop: 8, fontStyle: 'italic' }}>
            Special thanks to the Bitcoin mining open-source community.
          </div>
        </div>
      </AboutCard>

      <footer style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
        <a
          href={fundContributeUrl('about_footer')}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent, #FAA500)', fontWeight: 600 }}
        >
          Buy Me a Coffee
        </a>
        {' '}to support JMSCNC Heater OS
      </footer>
    </div>
  );
}

// ─── Reusable card wrapper ───────────────────────────────────
function AboutCard({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      background: 'var(--card-bg, #242432)',
      borderRadius: 12,
      padding: 16,
      border: '1px solid var(--border, rgba(255,255,255,0.06))',
      marginBottom: last ? 0 : 16,
    }}>
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: '0.05em',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Info row ───────────────────────────────────────────────
function InfoRow({ label, value, accent, mono }: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      fontSize: '0.85rem',
    }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span style={{
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'JetBrains Mono', monospace",
        color: accent ? 'var(--accent, #FAA500)' : 'var(--text, #E8E8E8)',
        fontWeight: accent ? 600 : 400,
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Link row ───────────────────────────────────────────────
function AboutLink({ href, label, description }: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: 8,
        background: 'rgba(247, 147, 26, 0.06)',
        border: '1px solid rgba(247, 147, 26, 0.12)',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(247, 147, 26, 0.12)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(247, 147, 26, 0.06)'; }}
    >
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent, #FAA500)' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {description}
        </div>
      </div>
      <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{'\u2192'}</span>
    </a>
  );
}
