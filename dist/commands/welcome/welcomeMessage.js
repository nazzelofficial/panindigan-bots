import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "welcomemessage",
    description: "Set the welcome message. Placeholders: {mention}, {user}, {server}, {memberCount}",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("set").setDescription("Set the welcome message")
        .addStringOption((o) => o.setName("message").setDescription("Welcome message (supports {mention}, {user}, {server}, {memberCount})").setRequired(true).setMaxLength(1000)))
        .addSubcommand((s) => s.setName("view").setDescription("View current welcome message"))
        .addSubcommand((s) => s.setName("reset").setDescription("Reset to default welcome message")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "view";
        if (sub === "set") {
            const msg = ctx.isSlash ? ctx.interaction.options.getString("message", true) : ctx.args.slice(1).join(" ");
            if (!msg) {
                await ctx.reply({ embeds: [errorEmbed("Please provide a message.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.message": msg } }, { upsert: true });
            const preview = msg.replace("{mention}", "@NewMember").replace("{user}", "NewMember").replace("{server}", guild.name).replace("{memberCount}", guild.memberCount.toString());
            await ctx.reply({ embeds: [successEmbed(`Welcome message updated.\n\nPreview:\n> ${preview}`)] });
        }
        else if (sub === "view") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const msg = cfg?.welcome?.message ?? "Welcome to {server}, {mention}! You are member #{memberCount}.";
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("👋 Welcome Message").setDescription(msg).addFields({ name: "Placeholders", value: "`{mention}` `{user}` `{server}` `{memberCount}`" })] });
        }
        else {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.message": "Welcome to {server}, {mention}! You are member #{memberCount}." } });
            await ctx.reply({ embeds: [successEmbed("Welcome message reset to default.")] });
        }
    },
};
export default command;
//# sourceMappingURL=welcomeMessage.js.map