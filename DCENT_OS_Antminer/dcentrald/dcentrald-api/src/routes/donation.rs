//! W9.5: Donation pool public-info endpoint.
//!
//! Read-only, intentionally public disclosure of where the configured
//! donation (dev-support) slice flows. JMSCNC Heater OS mines the donation
//! slice to the Mining Dutch account `revjmoney`. Mining Dutch is an
//! account-based pool, so there is NO single on-chain payout address to
//! verify: `payout_address` and `explorer_url` are empty strings and the
//! disclosure text says so plainly instead of pointing at an address that
//! does not exist.
//!
//! This endpoint is intentionally separate from `/api/config/donation`
//! (write-capable, requires auth) and from the failover snapshot at
//! `/api/pools` (which mixes user-pool failover with donation slice
//! routing). It is callable without auth and exposes only fields that
//! are already visible in `dcentrald.toml`'s `[donation]` section.
//!
//! Routes:
//!   - `GET /api/donation/info`: pool URL, worker, honest disclosure

use std::sync::Arc;

use axum::extract::State;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};

use crate::AppState;

/// On-chain payout address for the donation slice. Empty: the donation
/// slice mines to an account-based pool (Mining Dutch), which has no single
/// on-chain payout address. Kept as a constant (and as a response key) so
/// the response shape stays compatible with existing dashboard clients.
pub const DONATION_PAYOUT_ADDRESS: &str = "";

/// Honest disclosure shown next to the donation route.
pub const DONATION_DISCLOSURE: &str = "The donation slice mines to the Mining Dutch account revjmoney (account-based pool). There is no single on-chain payout address to verify.";

/// Default donation pool URL. Mirrors the `donation.pool_url` default
/// in `dcentrald::config` so both sources agree even when the operator
/// has not saved a custom donation config.
const DEFAULT_DONATION_POOL_URL: &str = "stratum+tcp://americas.mining-dutch.nl:9996";

/// Default donation worker. Mirrors `dcentrald::config`.
const DEFAULT_DONATION_WORKER: &str = "revjmoney.heateros";

/// `GET /api/donation/info` — public donation pool disclosure.
///
/// Read-only. No auth required. Reads donation pool URL + worker from
/// `[donation]` section of the config (with defaults baked in for the
/// case where the operator has never saved a donation config).
///
/// Response shape (keys unchanged from the upstream contract; the address
/// and explorer fields are empty because the pool is account-based):
/// ```json
/// {
///   "pool_url": "stratum+tcp://americas.mining-dutch.nl:9996",
///   "pool_host": "americas.mining-dutch.nl:9996",
///   "worker": "revjmoney.heateros",
///   "payout_address": "",
///   "explorer_url": "",
///   "explorer_name": "",
///   "verify_label": "",
///   "trust_model": "account_based_pool",
///   "disclosure": "The donation slice mines to the Mining Dutch account revjmoney (account-based pool). There is no single on-chain payout address to verify."
/// }
/// ```
async fn get_donation_info(State(_state): State<Arc<AppState>>) -> impl IntoResponse {
    let table = std::fs::read_to_string(crate::rest::get_config_path())
        .ok()
        .and_then(|contents| toml::from_str::<toml::Table>(&contents).ok());
    let donation = table
        .as_ref()
        .and_then(|table| table.get("donation"))
        .and_then(|value| value.as_table());

    let pool_url = donation
        .and_then(|table| table.get("pool_url"))
        .and_then(|value| value.as_str())
        .unwrap_or(DEFAULT_DONATION_POOL_URL)
        .to_string();
    let worker = donation
        .and_then(|table| table.get("worker"))
        .and_then(|value| value.as_str())
        .unwrap_or(DEFAULT_DONATION_WORKER)
        .to_string();

    let pool_host = pool_url
        .strip_prefix("stratum+tcp://")
        .unwrap_or(pool_url.as_str())
        .to_string();
    Json(donation_info_body(&pool_url, &pool_host, &worker))
}

fn donation_info_body(pool_url: &str, pool_host: &str, worker: &str) -> serde_json::Value {
    serde_json::json!({
        "pool_url": pool_url,
        "pool_host": pool_host,
        "worker": worker,
        "payout_address": DONATION_PAYOUT_ADDRESS,
        "explorer_url": "",
        "explorer_name": "",
        "verify_label": "",
        "trust_model": "account_based_pool",
        "disclosure": DONATION_DISCLOSURE,
    })
}

/// Build the donation sub-router. Merged into the top-level router by
/// `rest::build_router()`.
pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/donation/info", get(get_donation_info))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn account_based_pool_has_no_payout_address_or_explorer_link() {
        // Mining Dutch is account-based: never advertise an on-chain
        // address or a block-explorer link that cannot verify anything.
        assert_eq!(DONATION_PAYOUT_ADDRESS, "");
        let body = donation_info_body(
            DEFAULT_DONATION_POOL_URL,
            "americas.mining-dutch.nl:9996",
            DEFAULT_DONATION_WORKER,
        );
        assert_eq!(body["payout_address"], "");
        assert_eq!(body["explorer_url"], "");
        assert_eq!(body["explorer_name"], "");
        assert_eq!(body["trust_model"], "account_based_pool");
        assert_eq!(
            body["pool_url"],
            "stratum+tcp://americas.mining-dutch.nl:9996"
        );
        assert_eq!(body["worker"], "revjmoney.heateros");
        let disclosure = body["disclosure"].as_str().unwrap();
        assert!(disclosure.contains("Mining Dutch account revjmoney"));
        assert!(disclosure.contains("no single on-chain payout address"));
        // Response keys stay compatible with the upstream contract.
        for key in [
            "pool_url",
            "pool_host",
            "worker",
            "payout_address",
            "explorer_url",
            "explorer_name",
            "verify_label",
            "trust_model",
            "disclosure",
        ] {
            assert!(body.get(key).is_some(), "missing key {key}");
        }
    }

    #[test]
    fn default_route_matches_daemon_defaults() {
        assert_eq!(
            DEFAULT_DONATION_POOL_URL,
            "stratum+tcp://americas.mining-dutch.nl:9996"
        );
        assert_eq!(DEFAULT_DONATION_WORKER, "revjmoney.heateros");
    }
}
