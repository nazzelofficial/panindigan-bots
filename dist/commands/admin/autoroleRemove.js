import { GuildModel } from "../../database/models/Guild";
const command = {
    name: "autorole_remove",
    description: "Remove an auto role",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)),
    async execute(ctx) {
        const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : null;
        if (!role)
            return;
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const config = await GuildModel.findOne({ guildId: guild.id });
        const autoRoleIds = config?.autoRoleIds || [];
        if (!autoRoleIds.includes(role.id)) {
            return ctx.reply({ content: "❌ Role is not an auto role" });
        }
        const newAutoRoleIds = autoRoleIds.filter((id) => id !== role.id);
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { autoRoleIds: newAutoRoleIds }, { upsert: true });
        await ctx.reply({ content: `✅ Removed ${role.name} from auto roles` });
    },
};
export default command;
//# sourceMappingURL=autoroleRemove.js.map