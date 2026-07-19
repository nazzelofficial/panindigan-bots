import { GuildModel } from "@/database/models/Guild";
const command = {
    name: "adminrole_set",
    description: "Set the admin role",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addRoleOption((o) => o.setName("role").setDescription("Admin role").setRequired(true)),
    async execute(ctx) {
        const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : null;
        if (!role)
            return;
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { adminRoleIds: [role.id] }, { upsert: true });
        await ctx.reply({ content: `✅ Set admin role to ${role.name}` });
    },
};
export default command;
//# sourceMappingURL=adminroleSet.js.map