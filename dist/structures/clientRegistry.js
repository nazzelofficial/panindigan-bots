/**
 * Small escape hatch so feature modules that don't receive `client` directly
 * (e.g. Mongoose post-save hooks, scheduled cron jobs) can still reach the
 * live Discord client without creating circular imports.
 */
let instance = null;
export function setClientInstance(client) {
    instance = client;
}
export function getClientInstance() {
    return instance;
}
/** Legacy compat shim — owner commands that import `clientRegistry` */
export const clientRegistry = {
    get() {
        return instance;
    },
    set(client) {
        instance = client;
    },
};
//# sourceMappingURL=clientRegistry.js.map