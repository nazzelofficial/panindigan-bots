import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "customcommandlist",
    description: "List all custom commands configured for this server",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    cooldown: 5,
    aliases: ["listcustomcmds", "cclist"],
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const cmds = cfg?.customCommands ?? [];
        if (!cmds.length) {
            await ctx.reply({ embeds: [infoEmbed("No custom commands configured. Use `customcommandadd` to create one.")] });
            return;
        }
        const embed = baseEmbed("primary")
            .setTitle("📋 Custom Commands")
            .setDescription(cmds.slice(0, 50).map((c, i) => `**${i + 1}.** \`${c.name}\` — ${c.response.slice(0, 60)}${c.response.length > 60 ? "…" : ""}`).join("\n"))
            .setFooter({ text: `${cmds.length} custom command${cmds.length !== 1 ? "s" : ""}` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=customcommandList.js.map