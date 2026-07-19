import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "stealemoji",
    description: "Kopyahin ang isang emoji mula sa ibang server papasok dito",
    category: "Utility",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageGuildExpressions],
    botPermissions: [PermissionFlagsBits.ManageGuildExpressions],
    guildOnly: true,
    cooldown: 10,
    aliases: ["steal", "addemoji", "snatchmoji"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("emoji").setDescription("Ang emoji na kokopyahin (paste ang emoji)").setRequired(true))
        .addStringOption((o) => o.setName("name").setDescription("Pangalan ng emoji sa server na ito (default: same)").setRequired(false).setMaxLength(32)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const input = ctx.isSlash ? ctx.interaction.options.getString("emoji", true) : ctx.args[0];
        const nameOverride = ctx.isSlash ? ctx.interaction.options.getString("name") : ctx.args[1];
        if (!input) {
            await ctx.reply({ embeds: [errorEmbed("Provide a emoji.")] });
            return;
        }
        // Parse custom emoji from <:name:id> or <a:name:id>
        const customMatch = input.match(/<(a?):([^:]+):(\d+)>/);
        if (!customMatch) {
            await ctx.reply({ embeds: [errorEmbed("I-paste ang custom emoji mismo (e.g. 😸 o <:pepethink:123456>). Hindi suportado ang default Discord emojis.")] });
            return;
        }
        const animated = customMatch[1] === "a";
        const emojiName = nameOverride ?? customMatch[2];
        const emojiId = customMatch[3];
        const ext = animated ? "gif" : "png";
        const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        const created = await guild.emojis.create({
            attachment: url,
            name: emojiName.replace(/[^a-zA-Z0-9_]/g, "_"),
            reason: `Stolen by ${ctx.userId}`,
        }).catch((e) => e);
        if (created instanceof Error) {
            await ctx.reply({ embeds: [errorEmbed(`Hindi ma-add ang emoji: ${created.message}\n\nBaka puno na ang emoji slots ng server.`)] });
            return;
        }
        await ctx.reply({ embeds: [successEmbed(`✅ Na-add ang emoji ${created} sa server!\n**Name:** \`:${created.name}:\`\n**ID:** \`${created.id}\`\n**Animated:** ${created.animated ? "Yes" : "No"}`)] });
    },
};
export default command;
//# sourceMappingURL=stealemoji.js.map