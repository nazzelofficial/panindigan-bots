import { GuildModel } from "@/database/models/Guild";
import { successEmbed } from "@/utils/embeds";
const command = {
    name: "247",
    description: "⭐ Toggle 24/7 mode — keep the bot connected to voice even when the queue is empty",
    category: "Music",
    access: "admin",
    premium: true,
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable 24/7 mode").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[0]?.toLowerCase() !== "off";
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "music.mode247": enabled } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`24/7 mode **${enabled ? "enabled" : "disabled"}**. ${enabled ? "The bot will stay in the voice channel when the queue ends." : "The bot will disconnect when the queue is empty."}`)] });
    },
};
export default command;
//# sourceMappingURL=247.js.map