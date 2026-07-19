import { PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { ColorRoleModel } from "../../database/models/Community";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds";
const command = {
    name: "colorrole",
    description: "Set up a color role picker so members can choose their name color",
    category: "Roles",
    access: "admin",
    premium: true,
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    botPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    aliases: ["crole", "namecolor"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("setup")
        .setDescription("Set up the color role picker in a channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to post the color picker").setRequired(true)))
        .addSubcommand((s) => s.setName("add")
        .setDescription("Add a color role to the picker")
        .addRoleOption((o) => o.setName("role").setDescription("Color role to add").setRequired(true))
        .addStringOption((o) => o.setName("label").setDescription("Display label (e.g. 'Red', 'Blue')").setRequired(false)))
        .addSubcommand((s) => s.setName("remove")
        .setDescription("Remove a color role from the picker")
        .addRoleOption((o) => o.setName("role").setDescription("Color role to remove").setRequired(true)))
        .addSubcommand((s) => s.setName("list").setDescription("List all color roles"))
        .addSubcommand((s) => s.setName("disable").setDescription("Disable the color role picker")),
    registerComponents(client) {
        client.componentHandlers.set("colorrole", async (interaction) => {
            if (!interaction.isStringSelectMenu())
                return;
            const guild = interaction.guild;
            if (!guild)
                return;
            const panel = await ColorRoleModel.findOne({ guildId: guild.id }).lean();
            if (!panel) {
                await interaction.reply({ content: "Color role panel not found.", ephemeral: true });
                return;
            }
            const member = await guild.members.fetch(interaction.user.id).catch(() => null);
            if (!member)
                return;
            const selectedRoleId = interaction.values[0];
            // Remove all existing color roles
            for (const roleId of panel.roleIds) {
                if (member.roles.cache.has(roleId)) {
                    await member.roles.remove(roleId, "Color role change").catch(() => { });
                }
            }
            if (selectedRoleId && selectedRoleId !== "none") {
                const role = guild.roles.cache.get(selectedRoleId);
                if (role) {
                    await member.roles.add(selectedRoleId, "Color role assign").catch(() => { });
                    await interaction.reply({ content: `✅ Your color has been set to **${role.name}**!`, ephemeral: true });
                    return;
                }
            }
            await interaction.reply({ content: "✅ Your color role has been removed.", ephemeral: true });
        });
    },
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "setup") {
            const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : null;
            const ch = channel ?? ctx.message?.channel;
            if (!ch?.isTextBased?.()) {
                await ctx.reply({ embeds: [errorEmbed("Invalid channel.")] });
                return;
            }
            let panel = await ColorRoleModel.findOne({ guildId: guild.id });
            const roleIds = panel?.roleIds ?? [];
            const opts = roleIds.length
                ? roleIds.map((id) => {
                    const role = guild.roles.cache.get(id);
                    const hex = role?.hexColor ?? "#000000";
                    return new StringSelectMenuOptionBuilder().setLabel(role?.name ?? id).setValue(id).setDescription(hex);
                })
                : [new StringSelectMenuOptionBuilder().setLabel("No colors yet — use /colorrole add").setValue("none")];
            opts.unshift(new StringSelectMenuOptionBuilder().setLabel("🚫 Remove my color").setValue("none").setDescription("Clear your current color role"));
            const menu = new StringSelectMenuBuilder()
                .setCustomId("colorrole:pick")
                .setPlaceholder("🎨 Choose your name color")
                .setMinValues(0).setMaxValues(1)
                .addOptions(opts.slice(0, 25));
            const embed = baseEmbed("primary")
                .setTitle("🎨 Color Role Picker")
                .setDescription("Select a color from the dropdown to change your name color. Choose **Remove my color** to clear it.");
            const msg = await ch.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
            if (panel) {
                panel.channelId = ch.id;
                panel.messageId = msg.id;
                await panel.save();
            }
            else {
                await ColorRoleModel.create({ guildId: guild.id, channelId: ch.id, messageId: msg.id, roleIds: [] });
            }
            await ctx.reply({ embeds: [successEmbed(`Color role picker set up in ${ch}! Use \`/colorrole add\` to add color roles.`)] });
        }
        else if (sub === "add") {
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            const panel = await ColorRoleModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { roleIds: role.id } }, { upsert: true, new: true });
            // Refresh the message if it exists
            if (panel.channelId && panel.messageId) {
                const ch = guild.channels.cache.get(panel.channelId);
                const msg = await ch?.messages.fetch(panel.messageId).catch(() => null);
                if (msg) {
                    const opts = [
                        new StringSelectMenuOptionBuilder().setLabel("🚫 Remove my color").setValue("none").setDescription("Clear your color role"),
                        ...panel.roleIds.map((id) => {
                            const r = guild.roles.cache.get(id);
                            return new StringSelectMenuOptionBuilder().setLabel(r?.name ?? id).setValue(id).setDescription(r?.hexColor ?? "#000000");
                        }),
                    ].slice(0, 25);
                    const menu = new StringSelectMenuBuilder().setCustomId("colorrole:pick").setPlaceholder("🎨 Choose your name color").setMinValues(0).setMaxValues(1).addOptions(opts);
                    await msg.edit({ components: [new ActionRowBuilder().addComponents(menu)] }).catch(() => { });
                }
            }
            await ctx.reply({ embeds: [successEmbed(`${role} added to the color role picker.`)] });
        }
        else if (sub === "remove") {
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            await ColorRoleModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { roleIds: role.id } });
            await ctx.reply({ embeds: [successEmbed(`${role} removed from the color role picker.`)] });
        }
        else if (sub === "list") {
            const panel = await ColorRoleModel.findOne({ guildId: guild.id }).lean();
            if (!panel || !panel.roleIds.length) {
                await ctx.reply({ embeds: [infoEmbed("No color roles configured. Use `/colorrole add` to add some.")] });
                return;
            }
            const embed = baseEmbed("primary").setTitle("🎨 Color Roles").setDescription(panel.roleIds.map((id) => {
                const role = guild.roles.cache.get(id);
                return `${role ?? `<@&${id}>`} — \`${role?.hexColor ?? "?"}\``;
            }).join("\n"));
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "disable") {
            const panel = await ColorRoleModel.findOneAndDelete({ guildId: guild.id });
            if (!panel) {
                await ctx.reply({ embeds: [infoEmbed("Color role picker is not configured.")] });
                return;
            }
            if (panel.channelId && panel.messageId) {
                const ch = guild.channels.cache.get(panel.channelId);
                const msg = await ch?.messages.fetch(panel.messageId).catch(() => null);
                await msg?.delete().catch(() => { });
            }
            await ctx.reply({ embeds: [successEmbed("Color role picker disabled and message deleted.")] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: setup | add | remove | list | disable")] });
        }
    },
};
export default command;
//# sourceMappingURL=colorrole.js.map