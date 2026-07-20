import { GuildModel } from "../../database/models/Guild.js";
const command = {
    name: "autorole_add",
    description: "Add an auto role for new members",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addRoleOption((o) => o.setName("role").setDescription("Role to assign").setRequired(true)),
    async execute(ctx) {
        const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : null;
        if (!role)
            return;
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const config = await GuildModel.findOne({ guildId: guild.id });
        const autoRoleIds = config?.autoRoleIds || [];
        if (autoRoleIds.includes(role.id)) {
            return ctx.reply({ content: "❌ Role is already an auto role" });
        }
        autoRoleIds.push(role.id);
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { autoRoleIds }, { upsert: true });
        await ctx.reply({ content: `✅ Added ${role.name} as an auto role` });
    },
};
export default command;
//# sourceMappingURL=autoroleAdd.js.map