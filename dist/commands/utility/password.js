import { baseEmbed, errorEmbed } from "@/utils/embeds";
import * as crypto from "node:crypto";
const CHARSET_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHARSET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARSET_NUM = "0123456789";
const CHARSET_SYM = "!@#$%^&*()-_=+[]{}|;:,.<>?";
function generatePassword(length, upper, numbers, symbols) {
    let charset = CHARSET_LOWER;
    if (upper)
        charset += CHARSET_UPPER;
    if (numbers)
        charset += CHARSET_NUM;
    if (symbols)
        charset += CHARSET_SYM;
    const bytes = crypto.randomBytes(length * 2);
    let pw = "";
    for (let i = 0; pw.length < length; i++) {
        pw += charset[bytes[i] % charset.length];
    }
    return pw;
}
function getStrength(length, upper, numbers, symbols) {
    let score = 0;
    if (length >= 12)
        score++;
    if (length >= 16)
        score++;
    if (upper)
        score++;
    if (numbers)
        score++;
    if (symbols)
        score++;
    if (score <= 1)
        return "🔴 Very Weak";
    if (score === 2)
        return "🟠 Weak";
    if (score === 3)
        return "🟡 Moderate";
    if (score === 4)
        return "🟢 Strong";
    return "💪 Very Strong";
}
const command = {
    name: "password",
    description: "Create random na secure password",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 3,
    aliases: ["genpassword", "pw"],
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("length").setDescription("Haba ng password (8-64, default: 16)").setRequired(false).setMinValue(8).setMaxValue(64))
        .addBooleanOption((o) => o.setName("uppercase").setDescription("Include uppercase letters? (default: true)").setRequired(false))
        .addBooleanOption((o) => o.setName("numbers").setDescription("Include numbers? (default: true)").setRequired(false))
        .addBooleanOption((o) => o.setName("symbols").setDescription("Include symbols? (default: true)").setRequired(false)),
    async execute(ctx) {
        const length = (ctx.isSlash ? ctx.interaction.options.getInteger("length") : parseInt(ctx.args[0] ?? "16")) ?? 16;
        const upper = (ctx.isSlash ? ctx.interaction.options.getBoolean("uppercase") : true) ?? true;
        const numbers = (ctx.isSlash ? ctx.interaction.options.getBoolean("numbers") : true) ?? true;
        const symbols = (ctx.isSlash ? ctx.interaction.options.getBoolean("symbols") : false) ?? false;
        if (length < 8 || length > 64) {
            await ctx.reply({ embeds: [errorEmbed("Ang haba ng password ay dapat 8-64 characters.")] });
            return;
        }
        const pw = generatePassword(length, upper, numbers, symbols);
        const strength = getStrength(length, upper, numbers, symbols);
        const embed = baseEmbed("primary")
            .setTitle("🔐 Generated Password")
            .addFields({ name: "Password", value: `\`\`\`${pw}\`\`\``, inline: false }, { name: "Strength", value: strength, inline: true }, { name: "Length", value: String(length), inline: true }, { name: "Character Sets", value: [
                "🔤 Lowercase",
                upper ? "🔠 Uppercase" : null,
                numbers ? "🔢 Numbers" : null,
                symbols ? "💥 Symbols" : null,
            ].filter(Boolean).join(", "), inline: false })
            .setFooter({ text: "⚠️ Huwag i-share ang password na ito! Itago sa ligtas na lugar." });
        if (ctx.isSlash) {
            await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Para sa seguridad, gamitin ang slash command `/password` para hindi makita ng iba ang iyong generated password.")] });
        }
    },
};
export default command;
//# sourceMappingURL=password.js.map