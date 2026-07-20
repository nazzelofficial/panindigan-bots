import { GuildModel } from "../database/models/Guild.js";
import { createWelcomeEmbed } from "../utils/welcomeEmbed.js";
export class WelcomeService {
    /**
     * Get welcome configuration for a guild
     */
    static async getConfig(guildId) {
        const config = await GuildModel.findOne({ guildId }).lean();
        return config?.welcome || null;
    }
    /**
     * Setup welcome system
     */
    static async setup(options) {
        const { guild, channelId, message } = options;
        const channel = guild.channels.cache.get(channelId);
        if (!channel?.isTextBased()) {
            return { success: false, message: "Invalid channel. Must be a text channel." };
        }
        const defaultMessage = "Welcome to {server}, {mention}! You are member #{memberCount}.";
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, {
            $set: {
                "welcome.enabled": true,
                "welcome.channelId": channelId,
                "welcome.message": message || defaultMessage,
            },
        }, { upsert: true });
        return { success: true, message: `Welcome messages enabled in ${channel}.` };
    }
    /**
     * Update welcome configuration field
     */
    static async updateField(options) {
        const { guild, field, value } = options;
        const validFields = [
            "enabled", "channelId", "message", "title", "description", "color",
            "footer", "thumbnail", "image", "banner", "background", "autoroleId",
            "dmEnabled", "language", "theme", "buttons", "embed", "cardEnabled",
            "cardTemplate", "cardBackgroundUrl"
        ];
        if (!validFields.includes(field)) {
            return { success: false, message: `Invalid field: ${field}` };
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { [`welcome.${field}`]: value } }, { upsert: true });
        return { success: true, message: `Welcome ${field} updated.` };
    }
    /**
     * Disable welcome system
     */
    static async disable(guildId) {
        await GuildModel.findOneAndUpdate({ guildId }, { $set: { "welcome.enabled": false } }, { upsert: true });
        return { success: true, message: "Welcome messages disabled." };
    }
    /**
     * Send welcome message
     */
    static async sendWelcome(member) {
        const config = await this.getConfig(member.guild.id);
        if (!config?.enabled || !config.channelId)
            return;
        const channel = member.guild.channels.cache.get(config.channelId);
        if (!channel?.isTextBased())
            return;
        try {
            const { embed, attachment } = await createWelcomeEmbed({
                user: member.user,
                member,
                guild: member.guild,
                channel: channel,
                config,
            });
            if (config.dmEnabled) {
                await member.user.send({ embeds: [embed], files: attachment ? [attachment] : [] }).catch(() => { });
            }
            if (config.embed) {
                await channel.send({ embeds: [embed], files: attachment ? [attachment] : [] }).catch(() => { });
            }
            else {
                const fillTemplate = (template, m) => {
                    return template
                        .replace(/{mention}/g, `${m}`)
                        .replace(/{user}/g, m.user.tag)
                        .replace(/{username}/g, m.user.username)
                        .replace(/{server}/g, m.guild.name)
                        .replace(/{memberCount}/g, String(m.guild.memberCount));
                };
                await channel.send({ content: fillTemplate(config.message, member) }).catch(() => { });
            }
            if (config.autoroleId) {
                await member.roles.add(config.autoroleId).catch(() => { });
            }
        }
        catch (error) {
            console.error("Failed to send welcome message:", error);
        }
    }
    /**
     * Reset welcome configuration to defaults
     */
    static async reset(guildId) {
        await GuildModel.findOneAndUpdate({ guildId }, {
            $set: {
                "welcome.enabled": false,
                "welcome.channelId": null,
                "welcome.message": "Welcome to {server}, {mention}! You are member #{memberCount}.",
                "welcome.title": null,
                "welcome.description": null,
                "welcome.color": "#57F287",
                "welcome.footer": null,
                "welcome.thumbnail": null,
                "welcome.image": null,
                "welcome.banner": null,
                "welcome.background": null,
                "welcome.autoroleId": null,
                "welcome.dmEnabled": false,
                "welcome.language": "en",
                "welcome.theme": "default",
                "welcome.buttons": false,
                "welcome.embed": true,
                "welcome.cardTemplate": "default",
                "welcome.cardBackgroundUrl": null,
                "welcome.randomMessages": [],
            },
        }, { upsert: true });
        return { success: true, message: "Welcome system reset to default settings." };
    }
    /**
     * Get welcome information
     */
    static async getInfo(guildId) {
        return this.getConfig(guildId);
    }
}
//# sourceMappingURL=WelcomeService.js.map