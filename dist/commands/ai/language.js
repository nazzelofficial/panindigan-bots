import { successEmbed, errorEmbed } from "@/utils/embeds";
import { GuildModel } from "@/database/models/Guild";
const SUPPORTED_LANGUAGES = {
    en: "English", fil: "Filipino/Tagalog", es: "Spanish", fr: "French",
    de: "German", ja: "Japanese", ko: "Korean", zh: "Chinese",
};
const command = {
    name: "ailanguage",
    description: "Set the preferred language for AI responses in this server",
    category: "AI",
    access: "admin",
    guildOnly: true,
    cooldown: 10,
    aliases: ["aispeaklang"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("language").setDescription("Preferred AI response language").setRequired(true)
        .addChoices(...Object.entries(SUPPORTED_LANGUAGES).map(([v, n]) => ({ name: n, value: v })))
        .addChoices({ name: "Auto (match user's language)", value: "auto" })),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const lang = ctx.isSlash ? ctx.interaction.options.getString("language", true) : ctx.args[0];
        if (!lang) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a language code.")] });
            return;
        }
        if (lang !== "auto" && !SUPPORTED_LANGUAGES[lang]) {
            await ctx.reply({ embeds: [errorEmbed(`Unsupported language. Choose from: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}, or "auto".`)] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { aiLanguage: lang } }, { upsert: true });
        const label = lang === "auto" ? "Auto-detect" : (SUPPORTED_LANGUAGES[lang] ?? lang);
        await ctx.reply({ embeds: [successEmbed(`🌐 AI response language set to **${label}**.`)] });
    },
};
export default command;
//# sourceMappingURL=language.js.map