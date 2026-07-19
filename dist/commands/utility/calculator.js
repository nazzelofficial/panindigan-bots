import { baseEmbed, errorEmbed } from "../../utils/embeds";
function safeEval(expr) {
    // Only allow safe math characters
    if (!/^[\d\s+\-*/().%^]+$/.test(expr))
        return null;
    try {
        // Replace ^ with ** for exponentiation
        const sanitized = expr.replace(/\^/g, "**");
        // Use Function to evaluate — this is safe since we've whitelisted characters
        const result = Function(`"use strict"; return (${sanitized})`)();
        if (typeof result !== "number" || !isFinite(result))
            return null;
        return result;
    }
    catch {
        return null;
    }
}
const command = {
    name: "calculator",
    description: "Evaluate a math expression",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 3,
    aliases: ["calc", "math", "evaluate", "eval-math"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("expression").setDescription("Math expression e.g. 2+2, (10*5)/3, 2^10").setRequired(true)),
    async execute(ctx) {
        const expr = ctx.isSlash
            ? ctx.interaction.options.getString("expression", true)
            : ctx.args.join(" ");
        if (!expr) {
            await ctx.reply({ embeds: [errorEmbed("Provide a math expression.")] });
            return;
        }
        const result = safeEval(expr);
        if (result === null) {
            await ctx.reply({ embeds: [errorEmbed("Invalid or unsafe expression. Only basic math operators (+, -, *, /, %, ^, parentheses) are allowed.")] });
            return;
        }
        const embed = baseEmbed("primary")
            .setTitle("🧮 Calculator")
            .addFields({ name: "Expression", value: `\`${expr}\``, inline: true }, { name: "Result", value: `\`${result}\``, inline: true });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=calculator.js.map