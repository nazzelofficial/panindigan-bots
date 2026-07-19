import { GuildModel } from "@/database/models/Guild";
const command = {
    name: "command_enable",
    description: "Enable a disabled command",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("command").setDescription("Command name to enable").setRequired(true)),
    async execute(ctx) {
        const commandName = ctx.isSlash ? ctx.interaction.options.getString("command", true) : ctx.args[0];
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const config = await GuildModel.findOne({ guildId: guild.id });
        const disabledCommands = config?.disabledCommands || [];
        if (!disabledCommands.includes(commandName)) {
            return ctx.reply({ content: "❌ Command is not disabled" });
        }
        const newDisabled = disabledCommands.filter((c) => c !== commandName);
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { disabledCommands: newDisabled }, { upsert: true });
        await ctx.reply({ content: `✅ Enabled command: ${commandName}` });
    },
};
export default command;
//# sourceMappingURL=commandEnable.js.map