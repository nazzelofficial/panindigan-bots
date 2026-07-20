/**
 * Embed helpers — thin aliases over EmbedFactory for backward compatibility.
 * All commands can import from here or from EmbedFactory directly.
 */
import { EmbedBuilder } from "discord.js";
import { config } from "../config/config.js";
import { EmbedFactory } from "../structures/EmbedFactory.js";
export { EmbedFactory };
export function baseEmbed(color = "primary") {
    return new EmbedBuilder().setColor(config.colors[color]).setTimestamp();
}
export function successEmbed(description) {
    return EmbedFactory.success(description);
}
export function errorEmbed(description) {
    return EmbedFactory.error(description);
}
export function infoEmbed(description) {
    return EmbedFactory.info(description);
}
export function warnEmbed(description) {
    return EmbedFactory.warning(description);
}
export function premiumEmbed(description) {
    return EmbedFactory.premium(description);
}
export function loadingEmbed(description) {
    return EmbedFactory.loading(description);
}
export function confirmEmbed(description) {
    return EmbedFactory.confirm(description);
}
export function dashboardEmbed(description) {
    return EmbedFactory.dashboard(description);
}
//# sourceMappingURL=embeds.js.map