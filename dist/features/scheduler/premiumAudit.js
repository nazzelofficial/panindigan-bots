import cron from "node-cron";
import { scopedLogger } from "@/utils/logger";
const log = scopedLogger("scheduler:premium-audit");
/**
 * Panindigan Premium is explicitly permanent/one-time-payment (no renewals,
 * no expiry) per the product spec. This job intentionally does NOT expire
 * anything — it exists as a scheduled integrity hook (hourly) that future
 * modules (e.g. Server Pack member swaps, refund processing) can extend
 * without re-plumbing a new cron job. Kept as an explicit no-op with logging
 * rather than a silent stub.
 */
export function startPremiumExpiryAudit() {
    cron.schedule("0 * * * *", () => {
        log.debug("Premium integrity audit tick (no-op: premium is permanent by design)");
    });
}
//# sourceMappingURL=premiumAudit.js.map