import { successEmbed } from "@/utils/embeds";
import { GuildModel } from "@/database/models/Guild";
const command = {
    name: "aiclear",
    description: "Clear the AI conversation history for this server",
    category: "AI",
    access: "admin",
    guildOnly: true,
    cooldown: 10,
    aliases: ["clearai", "resetai"],
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { aiConversationHistory: 1 } }, { upsert: false });
        await ctx.reply({ embeds: [successEmbed("🗑️ AI conversation history cleared for this server.")] });
    },
};
export default command;
//# sourceMappingURL=clear.js.map