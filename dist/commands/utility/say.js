import { PermissionFlagsBits } from "discord.js";
import { errorEmbed, baseEmbed } from "@/utils/embeds";
const command = {
    name: "say",
    description: "Make the bot say something in a channel (plain text or embed)",
    category: "Utility",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageMessages],
    guildOnly: true,
    cooldown: 5,
    aliases: ["announce", "echo"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("plain").setDescription("Magpadala ng plain text message")
        .addStringOption((o) => o.setName("message").setDescription("Message text").setRequired(true).setMaxLength(2000))
        .addChannelOption((o) => o.setName("channel").setDescription("Target channel (default: ito)").setRequired(false)))
        .addSubcommand((s) => s.setName("embed").setDescription("Magpadala ng embed message")
        .addStringOption((o) => o.setName("title").setDescription("Embed title").setRequired(true).setMaxLength(256))
        .addStringOption((o) => o.setName("description").setDescription("Embed description").setRequired(true).setMaxLength(2000))
        .addStringOption((o) => o.setName("color").setDescription("Embed color (hex, e.g. #FF5733)").setRequired(false))
        .addStringOption((o) => o.setName("footer").setDescription("Footer text").setRequired(false).setMaxLength(200))
        .addChannelOption((o) => o.setName("channel").setDescription("Target channel (default: ito)").setRequired(false))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : "plain";
        const chOpt = ctx.isSlash ? ctx.interaction.options.getChannel("channel") : null;
        const target = chOpt ? guild.channels.cache.get(chOpt.id) : (ctx.interaction?.channel ?? ctx.message?.channel);
        if (!target || !target.send) {
            await ctx.reply({ embeds: [errorEmbed("Hindi valid na channel.")] });
            return;
        }
        if (sub === "plain") {
            const msg = ctx.isSlash ? ctx.interaction.options.getString("message", true) : ctx.args.join(" ");
            if (!msg) {
                await ctx.reply({ embeds: [errorEmbed("Provide a message.")] });
                return;
            }
            await target.send(msg);
            if (ctx.isSlash)
                await ctx.interaction.reply({ content: "✅ Message sent.", ephemeral: true });
            else if (target.id !== ctx.message?.channelId)
                await ctx.reply({ embeds: [baseEmbed("success").setDescription("✅ Message sent.")] });
            return;
        }
        if (sub === "embed") {
            const title = ctx.isSlash ? ctx.interaction.options.getString("title", true) : ctx.args[0];
            const description = ctx.isSlash ? ctx.interaction.options.getString("description", true) : ctx.args.slice(1).join(" ");
            const colorInput = ctx.isSlash ? ctx.interaction.options.getString("color") : null;
            const footer = ctx.isSlash ? ctx.interaction.options.getString("footer") : null;
            if (!title || !description) {
                await ctx.reply({ embeds: [errorEmbed("Provide a title at description.")] });
                return;
            }
            let color = 0x5865f2;
            if (colorInput) {
                const parsed = parseInt(colorInput.replace("#", ""), 16);
                if (!isNaN(parsed))
                    color = parsed;
            }
            const embed = baseEmbed("primary").setTitle(title).setDescription(description).setColor(color);
            if (footer)
                embed.setFooter({ text: footer });
            await target.send({ embeds: [embed] });
            if (ctx.isSlash)
                await ctx.interaction.reply({ content: "✅ Embed sent.", ephemeral: true });
            else if (target.id !== ctx.message?.channelId)
                await ctx.reply({ embeds: [baseEmbed("success").setDescription("✅ Embed sent.")] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Gamitin ang: plain | embed")] });
    },
};
export default command;
//# sourceMappingURL=say.js.map