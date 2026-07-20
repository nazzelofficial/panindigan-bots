import type { Guild, TextChannel } from "discord.js";
import { GuildModel } from "../database/models/Guild.js";
import { createGoodbyeEmbed } from "../utils/goodbyeEmbed.js";

export interface GoodbyeConfig {
  enabled: boolean;
  channelId: string | null;
  message: string;
  title: string | null;
  description: string | null;
  color: string;
  footer: string | null;
  thumbnail: string | null;
  image: string | null;
  banner: string | null;
  background: string | null;
  dmEnabled: boolean;
  language: string;
  theme: string;
  buttons: boolean;
  embed: boolean;
  cardEnabled: boolean;
  cardTemplate: string;
  cardBackgroundUrl: string | null;
  randomMessages: string[];
}

export interface GoodbyeSetupOptions {
  guild: Guild;
  channelId: string;
  message?: string;
}

export interface GoodbyeUpdateOptions {
  guild: Guild;
  field: keyof GoodbyeConfig;
  value: any;
}

export class GoodbyeService {
  /**
   * Get goodbye configuration for a guild
   */
  static async getConfig(guildId: string): Promise<GoodbyeConfig | null> {
    const config = await GuildModel.findOne({ guildId }).lean();
    return (config as any)?.goodbye || null;
  }

  /**
   * Setup goodbye system
   */
  static async setup(options: GoodbyeSetupOptions): Promise<{ success: boolean; message: string }> {
    const { guild, channelId, message } = options;

    const channel = guild.channels.cache.get(channelId);
    if (!channel?.isTextBased()) {
      return { success: false, message: "Invalid channel. Must be a text channel." };
    }

    const defaultMessage = "{user} has left {server}. We now have {memberCount} members.";

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      {
        $set: {
          "goodbye.enabled": true,
          "goodbye.channelId": channelId,
          "goodbye.message": message || defaultMessage,
        },
      },
      { upsert: true }
    );

    return { success: true, message: `Goodbye messages enabled in ${channel}.` };
  }

  /**
   * Update goodbye configuration field
   */
  static async updateField(options: GoodbyeUpdateOptions): Promise<{ success: boolean; message: string }> {
    const { guild, field, value } = options;

    const validFields: (keyof GoodbyeConfig)[] = [
      "enabled", "channelId", "message", "title", "description", "color",
      "footer", "thumbnail", "image", "banner", "background",
      "dmEnabled", "language", "theme", "buttons", "embed", "cardEnabled",
      "cardTemplate", "cardBackgroundUrl"
    ];

    if (!validFields.includes(field)) {
      return { success: false, message: `Invalid field: ${field}` };
    }

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $set: { [`goodbye.${field}`]: value } },
      { upsert: true }
    );

    return { success: true, message: `Goodbye ${field} updated.` };
  }

  /**
   * Disable goodbye system
   */
  static async disable(guildId: string): Promise<{ success: boolean; message: string }> {
    await GuildModel.findOneAndUpdate(
      { guildId },
      { $set: { "goodbye.enabled": false } },
      { upsert: true }
    );

    return { success: true, message: "Goodbye messages disabled." };
  }

  /**
   * Send goodbye message
   */
  static async sendGoodbye(guild: Guild, userId: string, username: string): Promise<void> {
    const config = await this.getConfig(guild.id);
    if (!config?.enabled || !config.channelId) return;

    const channel = guild.channels.cache.get(config.channelId);
    if (!channel?.isTextBased()) return;

    const user = await guild.client.users.fetch(userId).catch(() => null);
    if (!user) return;

    try {
      const { embed, attachment } = await createGoodbyeEmbed({
        user,
        guild,
        channel: channel as any,
        config,
      });

      if (config.dmEnabled) {
        await user.send({ embeds: [embed], files: attachment ? [attachment] : [] }).catch(() => {});
      }

      if (config.embed) {
        await channel.send({ embeds: [embed], files: attachment ? [attachment] : [] }).catch(() => {});
      } else {
        const msg = (config.message ?? "Goodbye {user}! We hope to see you again.")
          .replace("{user}", username)
          .replace("{mention}", `<@${userId}>`)
          .replace("{server}", guild.name)
          .replace("{memberCount}", String(guild.memberCount));
        await channel.send({ content: msg }).catch(() => {});
      }
    } catch (error) {
      console.error("Failed to send goodbye message:", error);
    }
  }

  /**
   * Reset goodbye configuration to defaults
   */
  static async reset(guildId: string): Promise<{ success: boolean; message: string }> {
    await GuildModel.findOneAndUpdate(
      { guildId },
      {
        $set: {
          "goodbye.enabled": false,
          "goodbye.channelId": null,
          "goodbye.message": "{user} has left {server}. We now have {memberCount} members.",
          "goodbye.title": null,
          "goodbye.description": null,
          "goodbye.color": "#ED4245",
          "goodbye.footer": null,
          "goodbye.thumbnail": null,
          "goodbye.image": null,
          "goodbye.banner": null,
          "goodbye.background": null,
          "goodbye.dmEnabled": false,
          "goodbye.language": "en",
          "goodbye.theme": "default",
          "goodbye.buttons": false,
          "goodbye.embed": true,
          "goodbye.cardTemplate": "default",
          "goodbye.cardBackgroundUrl": null,
          "goodbye.randomMessages": [],
        },
      },
      { upsert: true }
    );

    return { success: true, message: "Goodbye system reset to default settings." };
  }

  /**
   * Get goodbye information
   */
  static async getInfo(guildId: string): Promise<GoodbyeConfig | null> {
    return this.getConfig(guildId);
  }
}
