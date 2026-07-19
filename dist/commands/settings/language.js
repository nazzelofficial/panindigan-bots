import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, baseEmbed } from "@/utils/embeds";
const LANGUAGES = [
    { name: "English", value: "en" },
    { name: "Filipino / Tagalog", value: "fil" },
    { name: "Bisaya / Cebuano", value: "ceb" },
    { name: "Ilocano", value: "ilo" },
];
const command = {
    name: "language",
    description: "View or set the bot's response language for this server",
    category: "Settings",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["lang"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("set").setDescription("Set the server language (Admin only)")
        .addStringOption((o) => o.setName("language").setDescription("Language to use").setRequired(true)
        .addChoices(...LANGUAGES)))
        .addSubcommand((s) => s.setName("view").setDescription("View the current language")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "view");
        if (sub === "set") {
            const member = ctx.interaction?.member ?? ctx.message?.member;
            const hasPerms = member?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
                member?.permissions?.has(PermissionFlagsBits.Administrator);
            if (!hasPerms) {
                await ctx.reply({ content: "❌ You need the **Manage Server** permission to change the server language.", ephemeral: true });
                return;
            }
            const lang = ctx.isSlash ? ctx.interaction.options.getString("language", true) : ctx.args[1]?.toLowerCase();
            const valid = LANGUAGES.find((l) => l.value === lang);
            if (!valid) {
                await ctx.reply({ content: `Invalid language. Choices: ${LANGUAGES.map((l) => l.value).join(", ")}` });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { language: lang } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Server language set to **${valid.name}**.`)] });
        }
        else {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const lang = cfg?.language ?? "en";
            const name = LANGUAGES.find((l) => l.value === lang)?.name ?? "English";
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🌐 Server Language").setDescription(`Current language: **${name}** (\`${lang}\`)`).setFooter({ text: "Admins can change this with /language set" })] });
        }
    },
};
export default command;
//# sourceMappingURL=language.js.map