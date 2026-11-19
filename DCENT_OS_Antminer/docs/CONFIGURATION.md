# Configuration

DCENT_OS is configured through a single TOML file. On a running miner it lives at
**`/data/dcentrald.toml`** (a read-only baked default ships in the image; the `/data` copy
overrides it and survives reboots and A/B upgrades). Edit it via the dashboard, the REST API, or
directly over SSH, then restart the daemon (`/etc/init.d/S82dcentrald restart`).

## Key sections

```toml
[mining]
enabled        = false   # fresh installs boot management-only until you enable mining
frequency_mhz  = 525     # per-platform; the autotuner adjusts within safe bounds

[[pool]]                 # your pool (you keep 100% of this hashtime)
url      = "stratum+tcp://your.pool:3333"
worker   = "your-btc-address-or-account"
password = "x"

[donation]               # 1% default, transparent, fully disableable
enabled       = true     # set false to turn the dev-support slice off
percent       = 1.0      # 0.0 to 5.0; set 0 or enabled=false to turn it off
pool_url      = "stratum+tcp://americas.mining-dutch.nl:9996"   # Mining Dutch (account-based)
worker        = "revjmoney.heateros"
fallback_enabled  = false  # off by default
fallback_pool_url = "stratum+tcp://americas.mining-dutch.nl:9996"  # same account as the primary
fallback_worker   = "revjmoney.heateros"
cycle_duration_s  = 3600 # at the default 1%, that's ~36s of donation per hour

[thermal]
fan_max_pwm = 30         # home/quiet cap; the daemon cuts hash before exceeding this

[power.psu_override]      # supported PSU-bypass lane; no smart-PSU/Loki when the platform matrix allows it
enabled  = false
model    = "APW3"
voltage_v = 12.8
```

## Donation

JMSCNC Heater OS sends **1% of hashing time to support development by default**. You can lower it
or turn it off at any time (Settings, the setup wizard, or `enabled = false` / `percent = 0`). It is
a transparent, time-sliced share of hashtime, never a hidden dev fee. It mines to the Mining Dutch
account `revjmoney` (worker `revjmoney.heateros`). Mining Dutch is an account-based pool, so there
is no single on-chain payout address to verify. The dashboard shows a live "DONATING" indicator
whenever the slice is active. The optional backup route is off by default and, if enabled, points
at the same account; it never extends your configured percentage and is never part of your own
pool's failover.

## Safety-relevant settings

- **`[thermal].fan_max_pwm`** caps fan noise for home/quiet operation. The daemon cuts hash power
  before exceeding this cap; raising it is an explicit choice.
- **`[mining].enabled = false`** keeps a fresh unit management-only (no hash power) until you opt in.
- Voltage and frequency are bounded by per-chip silicon profiles with hard clamps you can't exceed
  from config.

For the full runtime model, see [`DCENTRALD_ARCHITECTURE.md`](DCENTRALD_ARCHITECTURE.md).
