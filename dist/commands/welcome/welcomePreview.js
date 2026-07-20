import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
function fillTemplate(template, replacements) {
    return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? `{${key}}`);
}
const command = {
    name: "welcome preview",
    description: "Preview the welcome message",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const welcomeCfg = cfg?.welcome || {};
        if (!welcomeCfg.channelId) {
            await ctx.reply({ embeds: [errorEmbed("Run `welcome setup` first.")] });
            return;
        }
        const user = await ctx.client.users.fetch(ctx.userId);
        const replacements = {
            user: `<@${ctx.userId}>`,
            mention: `<@${ctx.userId}>`,
            username: user.username,
            displayname: user.displayName,
            server: guild.name,
            membercount: String(guild.memberCount),
            position: String(guild.memberCount),
            joindate: new Date().toLocaleDateString(),
            createdate: user.createdAt.toLocaleDateString(),
            avatar: user.displayAvatarURL(),
            icon: guild.iconURL() || "",
        };
        const text = fillTemplate(welcomeCfg.message ?? "Welcome {user}!", replacements);
        const title = welcomeCfg.title ? fillTemplate(welcomeCfg.title, replacements) : null;
        const description = welcomeCfg.description ? fillTemplate(welcomeCfg.description, replacements) : null;
        const footer = welcomeCfg.footer ? fillTemplate(welcomeCfg.footer, replacements) : null;
        const embed = baseEmbed("primary")
            .setColor(welcomeCfg.color || "#57F287")
            .setDescription(text)
            .setThumbnail(welcomeCfg.thumbnail || user.displayAvatarURL());
        if (title)
            embed.setTitle(title);
        if (description)
            embed.setDescription(description);
        if (footer)
            embed.setFooter({ text: footer });
        if (welcomeCfg.image)
            embed.setImage(welcomeCfg.image);
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=welcomePreview.js.map