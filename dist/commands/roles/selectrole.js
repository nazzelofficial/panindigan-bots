import { PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { SelectRolePanelModel } from "../../database/models/Community.js";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "selectrole",
    description: "Create dropdown/select-menu role selectors",
    category: "Roles",
    access: "admin",
    premium: true,
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    botPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    aliases: ["sr", "droprole"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("create")
        .setDescription("Create a select-menu role panel")
        .addStringOption((o) => o.setName("placeholder").setDescription("Placeholder text in the dropdown").setRequired(true))
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to post the panel (default: current)").setRequired(false))
        .addIntegerOption((o) => o.setName("maxroles").setDescription("Max roles a member can select at once (default: 1)").setRequired(false).setMinValue(1).setMaxValue(25)))
        .addSubcommand((s) => s.setName("addoption")
        .setDescription("Add a role option to an existing select panel")
        .addStringOption((o) => o.setName("messageid").setDescription("Panel message ID").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role to assign").setRequired(true))
        .addStringOption((o) => o.setName("label").setDescription("Display label for the option").setRequired(true))
        .addStringOption((o) => o.setName("description").setDescription("Short description of the option").setRequired(false))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji for this option").setRequired(false)))
        .addSubcommand((s) => s.setName("removeoption")
        .setDescription("Remove a role option from a panel")
        .addStringOption((o) => o.setName("messageid").setDescription("Panel message ID").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)))
        .addSubcommand((s) => s.setName("delete")
        .setDescription("Delete a select-role panel")
        .addStringOption((o) => o.setName("messageid").setDescription("Panel message ID").setRequired(true)))
        .addSubcommand((s) => s.setName("list").setDescription("List all select-role panels in this server")),
    registerComponents(client) {
        client.componentHandlers.set("selectrole", async (interaction) => {
            if (!interaction.isStringSelectMenu())
                return;
            const [, messageId] = interaction.customId.split(":");
            const guild = interaction.guild;
            if (!guild)
                return;
            const panel = await SelectRolePanelModel.findOne({ guildId: guild.id, messageId }).lean();
            if (!panel) {
                await interaction.reply({ content: "Panel not found.", ephemeral: true });
                return;
            }
            const member = await guild.members.fetch(interaction.user.id).catch(() => null);
            if (!member)
                return;
            const selectedRoleIds = interaction.values;
            const panelRoleIds = panel.options.map((o) => o.roleId);
            // Remove all panel roles first, then add selected
            for (const roleId of panelRoleIds) {
                if (member.roles.cache.has(roleId)) {
                    await member.roles.remove(roleId, "Select role deselect").catch(() => { });
                }
            }
            for (const roleId of selectedRoleIds) {
                const role = guild.roles.cache.get(roleId);
                if (role)
                    await member.roles.add(roleId, "Select role assign").catch(() => { });
            }
            const roleNames = selectedRoleIds.map((id) => guild.roles.cache.get(id)?.name ?? id).join(", ");
            await interaction.reply({
                content: selectedRoleIds.length
                    ? `✅ Your roles have been updated: **${roleNames}**`
                    : "✅ All roles from this panel have been removed.",
                ephemeral: true,
            });
        });
    },
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "create") {
            const placeholder = ctx.isSlash ? ctx.interaction.options.getString("placeholder", true) : ctx.args.slice(1).join(" ") || "Select a role...";
            const maxValues = ctx.isSlash ? (ctx.interaction.options.getInteger("maxroles") ?? 1) : 1;
            const channel = ctx.isSlash
                ? (ctx.interaction.options.getChannel("channel") ?? ctx.interaction.channel)
                : ctx.message?.channel;
            if (!channel?.isTextBased?.()) {
                await ctx.reply({ embeds: [errorEmbed("Invalid channel.")] });
                return;
            }
            const embed = baseEmbed("primary")
                .setTitle("🎭 Role Selection")
                .setDescription("Use the dropdown below to pick your role(s). You can change your selection at any time.");
            const menu = new StringSelectMenuBuilder()
                .setCustomId("selectrole:pending")
                .setPlaceholder(placeholder)
                .setMinValues(0)
                .setMaxValues(maxValues)
                .addOptions(new StringSelectMenuOptionBuilder().setLabel("No options yet — use /selectrole addoption").setValue("none").setDefault(false));
            const row = new ActionRowBuilder().addComponents(menu);
            const msg = await channel.send({ embeds: [embed], components: [row] });
            await SelectRolePanelModel.create({
                guildId: guild.id,
                channelId: channel.id,
                messageId: msg.id,
                placeholder,
                maxValues,
                options: [],
            });
            // Update customId now that we have message ID
            menu.setCustomId(`selectrole:${msg.id}`);
            await msg.edit({ components: [new ActionRowBuilder().addComponents(menu)] });
            await ctx.reply({ embeds: [successEmbed(`Select-role panel created in ${channel}! Use \`/selectrole addoption\` to add roles to it.`)] });
        }
        else if (sub === "addoption") {
            const messageId = ctx.isSlash ? ctx.interaction.options.getString("messageid", true) : ctx.args[1];
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[2]?.replace(/\D/g, "") ?? "");
            const label = ctx.isSlash ? ctx.interaction.options.getString("label", true) : ctx.args[3];
            const description = ctx.isSlash ? ctx.interaction.options.getString("description") : undefined;
            const emoji = ctx.isSlash ? ctx.interaction.options.getString("emoji") : undefined;
            if (!messageId || !role || !label) {
                await ctx.reply({ embeds: [errorEmbed("Provide message ID, role, and label.")] });
                return;
            }
            const panel = await SelectRolePanelModel.findOne({ guildId: guild.id, messageId });
            if (!panel) {
                await ctx.reply({ embeds: [errorEmbed("Panel not found.")] });
                return;
            }
            if (panel.options.length >= 25) {
                await ctx.reply({ embeds: [errorEmbed("Max 25 options per panel.")] });
                return;
            }
            if (panel.options.some((o) => o.roleId === role.id)) {
                await ctx.reply({ embeds: [errorEmbed("That role is already in the panel.")] });
                return;
            }
            panel.options.push({ roleId: role.id, label, description: description ?? null, emoji: emoji ?? null });
            await panel.save();
            // Rebuild the select menu
            const ch = guild.channels.cache.get(panel.channelId);
            const msg = await ch?.messages.fetch(messageId).catch(() => null);
            if (msg) {
                const opts = panel.options.map((o) => {
                    const opt = new StringSelectMenuOptionBuilder().setLabel(o.label).setValue(o.roleId);
                    if (o.description)
                        opt.setDescription(o.description);
                    if (o.emoji)
                        try {
                            opt.setEmoji(o.emoji);
                        }
                        catch { }
                    return opt;
                });
                const menu = new StringSelectMenuBuilder()
                    .setCustomId(`selectrole:${messageId}`)
                    .setPlaceholder(panel.placeholder)
                    .setMinValues(0)
                    .setMaxValues(Math.min(panel.maxValues ?? 1, opts.length))
                    .addOptions(opts);
                await msg.edit({ components: [new ActionRowBuilder().addComponents(menu)] }).catch(() => { });
            }
            await ctx.reply({ embeds: [successEmbed(`Option **${label}** → ${role} added to the panel.`)] });
        }
        else if (sub === "removeoption") {
            const messageId = ctx.isSlash ? ctx.interaction.options.getString("messageid", true) : ctx.args[1];
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[2]?.replace(/\D/g, "") ?? "");
            if (!messageId || !role) {
                await ctx.reply({ embeds: [errorEmbed("Provide message ID and role.")] });
                return;
            }
            const panel = await SelectRolePanelModel.findOne({ guildId: guild.id, messageId });
            if (!panel) {
                await ctx.reply({ embeds: [errorEmbed("Panel not found.")] });
                return;
            }
            const before = panel.options.length;
            panel.options = panel.options.filter((o) => o.roleId !== role.id);
            if (panel.options.length === before) {
                await ctx.reply({ embeds: [errorEmbed("That role wasn't found in this panel.")] });
                return;
            }
            await panel.save();
            // Rebuild select menu
            const ch = guild.channels.cache.get(panel.channelId);
            const msg = await ch?.messages.fetch(messageId).catch(() => null);
            if (msg) {
                if (panel.options.length === 0) {
                    const menu = new StringSelectMenuBuilder()
                        .setCustomId(`selectrole:${messageId}`)
                        .setPlaceholder(panel.placeholder)
                        .setMinValues(0).setMaxValues(1)
                        .addOptions(new StringSelectMenuOptionBuilder().setLabel("No options").setValue("none"));
                    await msg.edit({ components: [new ActionRowBuilder().addComponents(menu)] }).catch(() => { });
                }
                else {
                    const opts = panel.options.map((o) => {
                        const opt = new StringSelectMenuOptionBuilder().setLabel(o.label).setValue(o.roleId);
                        if (o.description)
                            opt.setDescription(o.description);
                        if (o.emoji)
                            try {
                                opt.setEmoji(o.emoji);
                            }
                            catch { }
                        return opt;
                    });
                    const menu = new StringSelectMenuBuilder()
                        .setCustomId(`selectrole:${messageId}`)
                        .setPlaceholder(panel.placeholder)
                        .setMinValues(0)
                        .setMaxValues(Math.min(panel.maxValues ?? 1, opts.length))
                        .addOptions(opts);
                    await msg.edit({ components: [new ActionRowBuilder().addComponents(menu)] }).catch(() => { });
                }
            }
            await ctx.reply({ embeds: [successEmbed(`Role ${role} removed from the panel.`)] });
        }
        else if (sub === "delete") {
            const messageId = ctx.isSlash ? ctx.interaction.options.getString("messageid", true) : ctx.args[1];
            const panel = await SelectRolePanelModel.findOneAndDelete({ guildId: guild.id, messageId });
            if (!panel) {
                await ctx.reply({ embeds: [errorEmbed("Panel not found.")] });
                return;
            }
            const ch = guild.channels.cache.get(panel.channelId);
            const msg = await ch?.messages.fetch(messageId).catch(() => null);
            await msg?.delete().catch(() => { });
            await ctx.reply({ embeds: [successEmbed("Select-role panel deleted.")] });
        }
        else if (sub === "list") {
            const panels = await SelectRolePanelModel.find({ guildId: guild.id }).lean().limit(10);
            if (!panels.length) {
                await ctx.reply({ embeds: [infoEmbed("No select-role panels configured.")] });
                return;
            }
            const embed = baseEmbed("primary").setTitle("🎭 Select-Role Panels").setDescription(panels.map((p) => `**${p.placeholder}** — ${p.options.length} option(s) · <#${p.channelId}> · \`${p.messageId}\``).join("\n"));
            await ctx.reply({ embeds: [embed] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: create | addoption | removeoption | delete | list")] });
        }
    },
};
export default command;
//# sourceMappingURL=selectrole.js.map