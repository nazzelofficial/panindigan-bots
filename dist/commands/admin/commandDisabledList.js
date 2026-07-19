import { EmbedBuilder } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
const command = {
    name: "command_disabled_list",
    description: "List all disabled commands",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const config = await GuildModel.findOne({ guildId: guild.id });
        const disabledCommands = config?.disabledCommands || [];
        if (disabledCommands.length === 0) {
            return ctx.reply({ content: "❌ No disabled commands" });
        }
        const embed = new EmbedBuilder()
            .setTitle("🚫 Disabled Commands")
            .setColor("#ff0000")
            .setDescription(disabledCommands.join("\n"))
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=commandDisabledList.js.map