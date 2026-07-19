import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "ticketsetup",
    description: "Set up the ticket system — configure the support category and log channel",
    category: "Tickets",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    slashData: (b) => b
        .addChannelOption((o) => o.setName("category").setDescription("Category channel where tickets are created").setRequired(true))
        .addChannelOption((o) => o.setName("log").setDescription("Channel for ticket logs (transcripts, events)").setRequired(false))
        .addRoleOption((o) => o.setName("support_role").setDescription("Support role with access to all tickets").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const categoryId = ctx.isSlash ? ctx.interaction.options.getChannel("category", true).id : ctx.args[0]?.replace(/\D/g, "");
        if (!categoryId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a category channel.")] });
            return;
        }
        const logId = ctx.isSlash ? (ctx.interaction.options.getChannel("log")?.id ?? null) : (ctx.args[1]?.replace(/\D/g, "") ?? null);
        const supportRoleId = ctx.isSlash ? (ctx.interaction.options.getRole("support_role")?.id ?? null) : (ctx.args[2]?.replace(/\D/g, "") ?? null);
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, {
            $set: {
                "tickets.enabled": true,
                "tickets.categoryId": categoryId,
                ...(logId ? { "tickets.logChannelId": logId } : {}),
                ...(supportRoleId ? { "tickets.supportRoleId": supportRoleId } : {}),
            },
        }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Ticket system **enabled**!\n• Category: <#${categoryId}>${logId ? `\n• Log: <#${logId}>` : ""}${supportRoleId ? `\n• Support Role: <@&${supportRoleId}>` : ""}\n\nUse \`/ticketpanel\` to send the ticket creation panel.`)] });
    },
};
export default command;
//# sourceMappingURL=ticketSetup.js.map