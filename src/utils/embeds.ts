/**
 * Embed helpers — thin aliases over EmbedFactory for backward compatibility.
 * All commands can import from here or from EmbedFactory directly.
 */

import { EmbedBuilder, type ColorResolvable } from "discord.js";
import { config } from "@/config/config";
import { EmbedFactory } from "@/structures/EmbedFactory";

export { EmbedFactory };

export function baseEmbed(color: keyof typeof config.colors = "primary"): EmbedBuilder {
  return new EmbedBuilder().setColor(config.colors[color] as ColorResolvable).setTimestamp();
}

export function successEmbed(description: string): EmbedBuilder {
  return EmbedFactory.success(description);
}

export function errorEmbed(description: string): EmbedBuilder {
  return EmbedFactory.error(description);
}

export function infoEmbed(description: string): EmbedBuilder {
  return EmbedFactory.info(description);
}

export function warnEmbed(description: string): EmbedBuilder {
  return EmbedFactory.warning(description);
}

export function premiumEmbed(description: string): EmbedBuilder {
  return EmbedFactory.premium(description);
}

export function loadingEmbed(description: string): EmbedBuilder {
  return EmbedFactory.loading(description);
}

export function confirmEmbed(description: string): EmbedBuilder {
  return EmbedFactory.confirm(description);
}

export function dashboardEmbed(description: string): EmbedBuilder {
  return EmbedFactory.dashboard(description);
}
