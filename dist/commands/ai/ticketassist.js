import { GuildModel } from "../../database/models/Guild.js";
const command = {
    name: "ticketassist",
    description: "Enable AI ticket assistance",
    category: "AI",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)),
    async execute(ctx) {
        const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[0] === "true";
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { ticketAssist: enabled }, { upsert: true });
        await ctx.reply({ content: `✅ Ticket assistance ${enabled ? "enabled" : "disabled"}` });
    },
};
export default command;
//# sourceMappingURL=ticketassist.js.map