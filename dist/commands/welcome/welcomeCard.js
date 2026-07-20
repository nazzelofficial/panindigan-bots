import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
const TEMPLATES = ["default", "minimal", "dark", "gradient", "banner", "pride"];
const command = {
    name: "welcomecard",
    description: "Customize the welcome card design shown when members join",
    category: "Welcome",
    access: "admin",
    premium: true,
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    aliases: ["wccard", "welcomedesign"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("template")
        .setDescription("Choose a built-in welcome card template")
        .addStringOption((o) => o
        .setName("name")
        .setDescription("Template name")
        .setRequired(true)
        .addChoices(...TEMPLATES.map((t) => ({ name: t.charAt(0).toUpperCase() + t.slice(1), value: t })))))
        .addSubcommand((s) => s
        .setName("background")
        .setDescription("Set a custom background image URL for the welcome card")
        .addStringOption((o) => o
        .setName("url")
        .setDescription("Direct image URL (PNG/JPG, recommended 1024×400)")
        .setRequired(true)))
        .addSubcommand((s) => s.setName("reset").setDescription("Reset welcome card to the default template"))
        .addSubcommand((s) => s.setName("preview").setDescription("Preview the current welcome card configuration")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "template") {
            const template = ctx.isSlash
                ? ctx.interaction.options.getString("name", true)
                : ctx.args[1]?.toLowerCase();
            if (!template || !TEMPLATES.includes(template)) {
                await ctx.reply({ embeds: [errorEmbed(`Invalid template. Choose from: ${TEMPLATES.join(", ")}`)] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.cardTemplate": template } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Welcome card template set to **${template}**.`)] });
            return;
        }
        if (sub === "background") {
            const url = ctx.isSlash
                ? ctx.interaction.options.getString("url", true)
                : ctx.args[1];
            if (!url) {
                await ctx.reply({ embeds: [errorEmbed("Please provide an image URL.")] });
                return;
            }
            const urlPattern = /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i;
            if (!urlPattern.test(url)) {
                await ctx.reply({ embeds: [errorEmbed("Please provide a valid direct image URL (must end in .png, .jpg, .jpeg, .webp, or .gif).")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.cardBackgroundUrl": url } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed("Custom background image set for the welcome card.")] });
            return;
        }
        if (sub === "reset") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.cardTemplate": "default", "welcome.cardBackgroundUrl": null } });
            await ctx.reply({ embeds: [successEmbed("Welcome card reset to the default template.")] });
            return;
        }
        if (sub === "preview") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const wc = cfg?.welcome ?? {};
            const embed = baseEmbed("primary")
                .setTitle("🎨 Welcome Card Configuration")
                .addFields({ name: "Template", value: wc.cardTemplate ?? "default", inline: true }, { name: "Custom Background", value: wc.cardBackgroundUrl ? "[Custom URL set]" : "None (uses template default)", inline: true }, { name: "Welcome Enabled", value: wc.enabled ? "✅ Yes" : "❌ No", inline: true })
                .setFooter({ text: "Use /welcomecard template or /welcomecard background to customize" });
            if (wc.cardBackgroundUrl)
                embed.setImage(wc.cardBackgroundUrl);
            await ctx.reply({ embeds: [embed] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Use: template | background | reset | preview")] });
    },
};
export default command;
//# sourceMappingURL=welcomeCard.js.map