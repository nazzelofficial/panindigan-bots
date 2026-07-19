import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds";
const command = {
    name: "onboarding",
    description: "Configure server onboarding steps shown to new members",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["onboardingtemplate"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("enable").setDescription("Enable onboarding for new members"))
        .addSubcommand((s) => s.setName("disable").setDescription("Disable onboarding"))
        .addSubcommand((s) => s.setName("addstep").setDescription("Add an onboarding step")
        .addStringOption((o) => o.setName("title").setDescription("Step title").setRequired(true).setMaxLength(100))
        .addStringOption((o) => o.setName("description").setDescription("Step description").setRequired(true).setMaxLength(500)))
        .addSubcommand((s) => s.setName("liststeps").setDescription("List all onboarding steps"))
        .addSubcommand((s) => s.setName("clearsteps").setDescription("Remove all onboarding steps")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "liststeps");
        if (sub === "enable") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "onboarding.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed("Onboarding **enabled**. New members will see your onboarding steps.")] });
        }
        else if (sub === "disable") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "onboarding.enabled": false } });
            await ctx.reply({ embeds: [successEmbed("Onboarding **disabled**.")] });
        }
        else if (sub === "addstep") {
            const title = ctx.isSlash ? ctx.interaction.options.getString("title", true) : ctx.args[1];
            const description = ctx.isSlash ? ctx.interaction.options.getString("description", true) : ctx.args.slice(2).join(" ");
            if (!title || !description) {
                await ctx.reply({ embeds: [errorEmbed("Provide both a title and description.")] });
                return;
            }
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            if ((cfg?.onboarding?.steps ?? []).length >= 10) {
                await ctx.reply({ embeds: [errorEmbed("Maximum of 10 onboarding steps.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { "onboarding.steps": { title, description } } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Onboarding step **"${title}"** added.`)] });
        }
        else if (sub === "clearsteps") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "onboarding.steps": [] } });
            await ctx.reply({ embeds: [successEmbed("All onboarding steps cleared.")] });
        }
        else {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const steps = cfg?.onboarding?.steps ?? [];
            const embed = baseEmbed("primary")
                .setTitle("🎉 Onboarding Steps")
                .setDescription(steps.length ? steps.map((s, i) => `**${i + 1}. ${s.title}**\n${s.description}`).join("\n\n") : "No steps configured.")
                .setFooter({ text: `Status: ${cfg?.onboarding?.enabled ? "Enabled" : "Disabled"} • ${steps.length}/10 steps` });
            await ctx.reply({ embeds: [embed] });
        }
    },
};
export default command;
//# sourceMappingURL=onboardingTemplate.js.map