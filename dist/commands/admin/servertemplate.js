import { PermissionFlagsBits } from "discord.js";
import { ServerTemplateModel } from "../../database/models/Community";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds";
const command = {
    name: "servertemplate",
    description: "Save and apply server configuration templates",
    category: "Admin",
    access: "admin",
    premium: true,
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 15,
    aliases: ["template", "configtemplate"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("save")
        .setDescription("Save current server configuration as a template")
        .addStringOption((o) => o.setName("name").setDescription("Template name").setRequired(true).setMaxLength(32)))
        .addSubcommand((s) => s.setName("apply")
        .setDescription("Apply a saved template to this server")
        .addStringOption((o) => o.setName("name").setDescription("Template name to apply").setRequired(true)))
        .addSubcommand((s) => s.setName("list").setDescription("List all saved server templates"))
        .addSubcommand((s) => s.setName("delete")
        .setDescription("Delete a server template")
        .addStringOption((o) => o.setName("name").setDescription("Template name to delete").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "save") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            if (!name) {
                await ctx.reply({ embeds: [errorEmbed("Provide a template name.")] });
                return;
            }
            // Capture current channel/role structure as a snapshot (non-destructive)
            const snapshot = {
                roles: guild.roles.cache
                    .filter((r) => !r.managed && r.id !== guild.id)
                    .map((r) => ({ name: r.name, color: r.hexColor, permissions: r.permissions.bitfield.toString(), hoist: r.hoist, mentionable: r.mentionable, position: r.position })),
                channels: guild.channels.cache
                    .filter((c) => !c.isThread() && !c.isDMBased())
                    .map((c) => ({ name: c.name, type: c.type, parent: c.parentId ?? null, position: c.position ?? 0 })),
                capturedAt: new Date(),
                capturedBy: ctx.userId,
            };
            try {
                await ServerTemplateModel.findOneAndUpdate({ guildId: guild.id, name: name.toLowerCase() }, { guildId: guild.id, name: name.toLowerCase(), data: snapshot }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed(`Server configuration snapshot saved as template **${name}**.\n\nRoles: ${snapshot.roles.length} | Channels: ${snapshot.channels.length}`)] });
            }
            catch (e) {
                await ctx.reply({ embeds: [errorEmbed("Failed to save template: " + e.message)] });
            }
        }
        else if (sub === "apply") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            const template = await ServerTemplateModel.findOne({ guildId: guild.id, name: name?.toLowerCase() }).lean();
            if (!template) {
                await ctx.reply({ embeds: [errorEmbed(`Template **${name}** not found.`)] });
                return;
            }
            const data = template.data;
            await ctx.reply({
                embeds: [
                    infoEmbed(`📋 Template **${name}** loaded.\n\n**Snapshot info:**\n- Roles: ${data.roles?.length ?? 0}\n- Channels: ${data.channels?.length ?? 0}\n- Captured: <t:${Math.floor(new Date(data.capturedAt).getTime() / 1000)}:R>\n\n⚠️ Applying a template is a **manual guide** — compare your current setup to the snapshot above and make adjustments accordingly. Full auto-apply (creating/deleting roles and channels) would require Administrator permission and is irreversible.`),
                ],
            });
        }
        else if (sub === "list") {
            const templates = await ServerTemplateModel.find({ guildId: guild.id }).lean().limit(20);
            if (!templates.length) {
                await ctx.reply({ embeds: [infoEmbed("No templates saved. Use `/servertemplate save [name]` to create one.")] });
                return;
            }
            const embed = baseEmbed("primary").setTitle("📋 Server Templates").setDescription(templates.map((t) => {
                const d = t.data;
                const ts = Math.floor(new Date(d.capturedAt || t.createdAt).getTime() / 1000);
                return `**${t.name}** — ${d.roles?.length ?? "?"} roles, ${d.channels?.length ?? "?"} channels · <t:${ts}:R>`;
            }).join("\n"));
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "delete") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            const deleted = await ServerTemplateModel.findOneAndDelete({ guildId: guild.id, name: name?.toLowerCase() });
            if (!deleted) {
                await ctx.reply({ embeds: [errorEmbed(`Template **${name}** not found.`)] });
                return;
            }
            await ctx.reply({ embeds: [successEmbed(`Template **${name}** deleted.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: save | apply | list | delete")] });
        }
    },
};
export default command;
//# sourceMappingURL=servertemplate.js.map