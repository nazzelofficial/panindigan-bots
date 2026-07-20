import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "vanityurl",
    description: "Set or view this server's custom vanity URL for bot-related links",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    aliases: ["setvanity", "vanity"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("set")
        .setDescription("Set the server's vanity URL code")
        .addStringOption((o) => o.setName("code").setDescription("Vanity code (alphanumeric, hyphens allowed, 3-32 chars)").setRequired(true).setMinLength(3).setMaxLength(32)))
        .addSubcommand((s) => s.setName("view").setDescription("View the current vanity URL"))
        .addSubcommand((s) => s.setName("remove").setDescription("Remove the vanity URL")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "view";
        if (sub === "set") {
            const code = ctx.isSlash ? ctx.interaction.options.getString("code", true) : ctx.args[1];
            if (!code) {
                await ctx.reply({ embeds: [errorEmbed("Provide a vanity code.")] });
                return;
            }
            if (!/^[a-zA-Z0-9-]{3,32}$/.test(code)) {
                await ctx.reply({ embeds: [errorEmbed("Vanity code must be 3-32 characters long and contain only letters, numbers, and hyphens.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { vanityUrlCode: code.toLowerCase() }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Server vanity code set to **${code.toLowerCase()}**.\nThis code is used by the bot API and dashboard links for your server.`)] });
        }
        else if (sub === "view") {
            const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
            if (!doc?.vanityUrlCode) {
                await ctx.reply({ embeds: [infoEmbed("No vanity URL configured. Use `/vanityurl set [code]` to set one.")] });
                return;
            }
            await ctx.reply({ embeds: [successEmbed(`Current vanity code: **${doc.vanityUrlCode}**`)] });
        }
        else if (sub === "remove") {
            const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
            if (!doc?.vanityUrlCode) {
                await ctx.reply({ embeds: [infoEmbed("No vanity URL configured.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { vanityUrlCode: null });
            await ctx.reply({ embeds: [successEmbed("Vanity URL removed.")] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: set | view | remove")] });
        }
    },
};
export default command;
//# sourceMappingURL=vanityurl.js.map