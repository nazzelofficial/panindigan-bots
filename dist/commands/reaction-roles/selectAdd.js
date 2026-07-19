import { PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "selectadd",
    description: "Add a select-menu role panel — users pick roles from a dropdown",
    category: "Reaction Roles",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addRoleOption((o) => o.setName("role1").setDescription("First role option").setRequired(true))
        .addRoleOption((o) => o.setName("role2").setDescription("Second role option (optional)").setRequired(false))
        .addRoleOption((o) => o.setName("role3").setDescription("Third role option (optional)").setRequired(false))
        .addRoleOption((o) => o.setName("role4").setDescription("Fourth role option (optional)").setRequired(false))
        .addRoleOption((o) => o.setName("role5").setDescription("Fifth role option (optional)").setRequired(false))
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to send the dropdown (default: current channel)").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const roleIds = [1, 2, 3, 4, 5]
            .map((n) => ctx.isSlash ? ctx.interaction.options.getRole(`role${n}`)?.id : ctx.args[n - 1]?.replace(/\D/g, ""))
            .filter(Boolean);
        if (!roleIds.length) {
            await ctx.reply({ embeds: [errorEmbed("Please specify at least one role.")] });
            return;
        }
        const channelId = ctx.isSlash ? (ctx.interaction.options.getChannel("channel")?.id ?? ctx.interaction.channelId) : (ctx.message?.channelId ?? "");
        const ch = guild.channels.cache.get(channelId);
        if (!ch?.isTextBased()) {
            await ctx.reply({ embeds: [errorEmbed("Invalid channel.")] });
            return;
        }
        const options = roleIds.map((id) => {
            const role = guild.roles.cache.get(id);
            return { label: role?.name ?? id, value: `select_role:${id}` };
        });
        const select = new StringSelectMenuBuilder()
            .setCustomId(`selectrole:${guild.id}`)
            .setPlaceholder("Select a role…")
            .addOptions(options);
        const msg = await ch.send({ content: "Select a role from the dropdown below:", components: [new ActionRowBuilder().addComponents(select)] });
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { reactionRoles: { type: "select", messageId: msg.id, channelId, roleIds } } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Select role panel sent to <#${channelId}> with ${roleIds.length} option${roleIds.length !== 1 ? "s" : ""}.`)] });
    },
};
export default command;
//# sourceMappingURL=selectAdd.js.map