import { PermissionFlagsBits } from "discord.js";
import { WarningTemplateModel } from "@/database/models/Moderation";
import { ModCaseModel } from "@/database/models/Moderation";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";
import { createModCase } from "@/features/moderation/caseEngine";
import { sendLogEvent } from "@/features/logging/logEngine";
const command = {
    name: "warningtemplate",
    description: "Create and use reusable warning reason templates for efficient moderation",
    category: "Admin",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ModerateMembers],
    guildOnly: true,
    cooldown: 5,
    aliases: ["warntemplate", "warnt"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("add")
        .setDescription("Create a new warning template")
        .addStringOption((o) => o.setName("name").setDescription("Template name (short identifier)").setRequired(true).setMaxLength(32))
        .addStringOption((o) => o.setName("reason").setDescription("The warning reason text").setRequired(true).setMaxLength(500)))
        .addSubcommand((s) => s.setName("use")
        .setDescription("Warn a member using a saved template")
        .addStringOption((o) => o.setName("name").setDescription("Template name").setRequired(true))
        .addUserOption((o) => o.setName("user").setDescription("Member to warn").setRequired(true)))
        .addSubcommand((s) => s.setName("list").setDescription("List all saved warning templates"))
        .addSubcommand((s) => s.setName("delete")
        .setDescription("Delete a warning template")
        .addStringOption((o) => o.setName("name").setDescription("Template name to delete").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "add") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            const reason = ctx.isSlash ? ctx.interaction.options.getString("reason", true) : ctx.args.slice(2).join(" ");
            if (!name || !reason) {
                await ctx.reply({ embeds: [errorEmbed("Provide a template name and reason.")] });
                return;
            }
            try {
                await WarningTemplateModel.create({ guildId: guild.id, name: name.toLowerCase(), reason });
                await ctx.reply({ embeds: [successEmbed(`Warning template **${name}** created.\nReason: "${reason}"`)] });
            }
            catch (e) {
                if (e.code === 11000)
                    await ctx.reply({ embeds: [errorEmbed(`A template named **${name}** already exists.`)] });
                else
                    throw e;
            }
        }
        else if (sub === "use") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            const targetUser = ctx.isSlash ? ctx.interaction.options.getUser("user", true) : await ctx.client.users.fetch(ctx.args[2]?.replace(/\D/g, "") ?? "").catch(() => null);
            if (!name || !targetUser) {
                await ctx.reply({ embeds: [errorEmbed("Provide a template name and user.")] });
                return;
            }
            const template = await WarningTemplateModel.findOne({ guildId: guild.id, name: name.toLowerCase() }).lean();
            if (!template) {
                await ctx.reply({ embeds: [errorEmbed(`Template **${name}** not found. Use \`/warningtemplate list\` to see available templates.`)] });
                return;
            }
            const member = await guild.members.fetch(targetUser.id).catch(() => null);
            if (!member) {
                await ctx.reply({ embeds: [errorEmbed("Member not found in this server.")] });
                return;
            }
            await createModCase({ guildId: guild.id, userId: targetUser.id, moderatorId: ctx.userId, type: "warn", reason: template.reason });
            const warnCount = await ModCaseModel.countDocuments({ guildId: guild.id, userId: targetUser.id, type: "warn", active: true });
            await member.user.send({ embeds: [baseEmbed("warning").setDescription(`⚠️ You have been warned in **${guild.name}**.\n**Reason:** ${template.reason}\n**Warning count:** ${warnCount}`)] }).catch(() => { });
            await sendLogEvent(guild.id, "warn", () => baseEmbed("warning").setTitle("⚠️ Member Warned (Template)").addFields({ name: "User", value: `<@${targetUser.id}> (Warning #${warnCount})`, inline: true }, { name: "Moderator", value: `<@${ctx.userId}>`, inline: true }, { name: "Template", value: name, inline: true }, { name: "Reason", value: template.reason, inline: false }));
            await ctx.reply({ embeds: [successEmbed(`<@${targetUser.id}> warned using template **${name}** (Warning #${warnCount}).\nReason: ${template.reason}`)] });
        }
        else if (sub === "list") {
            const templates = await WarningTemplateModel.find({ guildId: guild.id }).lean().limit(25);
            if (!templates.length) {
                await ctx.reply({ embeds: [infoEmbed("No warning templates. Use `/warningtemplate add` to create one.")] });
                return;
            }
            const embed = baseEmbed("primary").setTitle("📋 Warning Templates").setDescription(templates.map((t) => `**${t.name}**\n↳ "${t.reason}"`).join("\n\n").slice(0, 4000));
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "delete") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            const deleted = await WarningTemplateModel.findOneAndDelete({ guildId: guild.id, name: name?.toLowerCase() });
            if (!deleted) {
                await ctx.reply({ embeds: [errorEmbed(`Template **${name}** not found.`)] });
                return;
            }
            await ctx.reply({ embeds: [successEmbed(`Template **${name}** deleted.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: add | use | list | delete")] });
        }
    },
};
export default command;
//# sourceMappingURL=warningtemplate.js.map