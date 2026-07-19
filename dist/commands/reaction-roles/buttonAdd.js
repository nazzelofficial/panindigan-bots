import { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "buttonadd",
    description: "Add a button role panel to a channel — users click a button to get a role",
    category: "Reaction Roles",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addRoleOption((o) => o.setName("role").setDescription("Role to assign when button is clicked").setRequired(true))
        .addStringOption((o) => o.setName("label").setDescription("Button label text").setRequired(true).setMaxLength(80))
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to send the button panel (default: current channel)").setRequired(false))
        .addStringOption((o) => o.setName("emoji").setDescription("Button emoji (optional)").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const roleId = ctx.isSlash ? ctx.interaction.options.getRole("role", true).id : ctx.args[0]?.replace(/\D/g, "");
        const label = ctx.isSlash ? ctx.interaction.options.getString("label", true) : ctx.args[1] ?? "Get Role";
        const channelId = ctx.isSlash ? (ctx.interaction.options.getChannel("channel")?.id ?? ctx.interaction.channelId) : (ctx.message?.channelId ?? "");
        const emoji = ctx.isSlash ? (ctx.interaction.options.getString("emoji") ?? null) : null;
        if (!roleId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] });
            return;
        }
        const ch = guild.channels.cache.get(channelId);
        if (!ch?.isTextBased()) {
            await ctx.reply({ embeds: [errorEmbed("Cannot send to that channel.")] });
            return;
        }
        const customId = `buttonrole:${roleId}`;
        const button = new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(ButtonStyle.Primary);
        if (emoji)
            button.setEmoji(emoji);
        const row = new ActionRowBuilder().addComponents(button);
        const msg = await ch.send({ content: `React to get the <@&${roleId}> role!`, components: [row] });
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { reactionRoles: { type: "button", messageId: msg.id, channelId, roleId, label } } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Button role panel sent to <#${channelId}>. Clicking the button grants <@&${roleId}>.`)] });
    },
};
export default command;
//# sourceMappingURL=buttonAdd.js.map