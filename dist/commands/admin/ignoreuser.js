import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "ignoreuser",
    description: "Prevent a user from using any bot commands in this server",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to ignore").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const userId = ctx.isSlash
            ? ctx.interaction.options.getUser("user", true).id
            : ctx.args[0]?.replace(/\D/g, "");
        if (!userId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a user.")] });
            return;
        }
        if (userId === ctx.userId) {
            await ctx.reply({ embeds: [errorEmbed("You cannot ignore yourself.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { ignoredUsers: userId } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`<@${userId}> is now ignored — they cannot use bot commands in this server.`)] });
    },
};
export default command;
//# sourceMappingURL=ignoreuser.js.map