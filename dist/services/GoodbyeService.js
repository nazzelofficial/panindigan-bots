import { GuildModel } from "../database/models/Guild.js";
import { createGoodbyeEmbed } from "../utils/goodbyeEmbed.js";
export class GoodbyeService {
    /**
     * Get goodbye configuration for a guild
     */
    static async getConfig(guildId) {
        const config = await GuildModel.findOne({ guildId }).lean();
        return config?.goodbye || null;
    }
    /**
     * Setup goodbye system
     */
    static async setup(options) {
        const { guild, channelId, message } = options;
        const channel = guild.channels.cache.get(channelId);
        if (!channel?.isTextBased()) {
            return { success: false, message: "Invalid channel. Must be a text channel." };
        }
        const defaultMessage = "{user} has left {server}. We now have {memberCount} members.";
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, {
            $set: {
                "goodbye.enabled": true,
                "goodbye.channelId": channelId,
                "goodbye.message": message || defaultMessage,
            },
        }, { upsert: true });
        return { success: true, message: `Goodbye messages enabled in ${channel}.` };
    }
    /**
     * Update goodbye configuration field
     */
    static async updateField(options) {
        const { guild, field, value } = options;
        const validFields = [
            "enabled", "channelId", "message", "title", "description", "color",
            "footer", "thumbnail", "image", "banner", "background",
            "dmEnabled", "language", "theme", "buttons", "embed", "cardEnabled",
            "cardTemplate", "cardBackgroundUrl"
        ];
        if (!validFields.includes(field)) {
            return { success: false, message: `Invalid field: ${field}` };
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { [`goodbye.${field}`]: value } }, { upsert: true });
        return { success: true, message: `Goodbye ${field} updated.` };
    }
    /**
     * Disable goodbye system
     */
    static async disable(guildId) {
        await GuildModel.findOneAndUpdate({ guildId }, { $set: { "goodbye.enabled": false } }, { upsert: true });
        return { success: true, message: "Goodbye messages disabled." };
    }
    /**
     * Send goodbye message
     */
    static async sendGoodbye(guild, userId, username) {
        const config = await this.getConfig(guild.id);
        if (!config?.enabled || !config.channelId)
            return;
        const channel = guild.channels.cache.get(config.channelId);
        if (!channel?.isTextBased())
            return;
        const user = await guild.client.users.fetch(userId).catch(() => null);
        if (!user)
            return;
        try {
            const { embed, attachment } = await createGoodbyeEmbed({
                user,
                guild,
                channel: channel,
                config,
            });
            if (config.dmEnabled) {
                await user.send({ embeds: [embed], files: attachment ? [attachment] : [] }).catch(() => { });
            }
            if (config.embed) {
                await channel.send({ embeds: [embed], files: attachment ? [attachment] : [] }).catch(() => { });
            }
            else {
                const msg = (config.message ?? "Goodbye {user}! We hope to see you again.")
                    .replace("{user}", username)
                    .replace("{mention}", `<@${userId}>`)
                    .replace("{server}", guild.name)
                    .replace("{memberCount}", String(guild.memberCount));
                await channel.send({ content: msg }).catch(() => { });
            }
        }
        catch (error) {
            console.error("Failed to send goodbye message:", error);
        }
    }
    /**
     * Reset goodbye configuration to defaults
     */
    static async reset(guildId) {
        await GuildModel.findOneAndUpdate({ guildId }, {
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
        }, { upsert: true });
        return { success: true, message: "Goodbye system reset to default settings." };
    }
    /**
     * Get goodbye information
     */
    static async getInfo(guildId) {
        return this.getConfig(guildId);
    }
}
//# sourceMappingURL=GoodbyeService.js.map