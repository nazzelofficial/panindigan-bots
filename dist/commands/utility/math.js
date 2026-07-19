import { baseEmbed, errorEmbed } from "@/utils/embeds";
function safeEval(expr) {
    if (!/^[\d\s+\-*/().%^]+$/.test(expr))
        return null;
    try {
        const sanitized = expr.replace(/\^/g, "**");
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
    name: "math",
    description: "Calculate a math expression",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("expression").setDescription("Math expression (e.g., 2+2)").setRequired(true)),
    async execute(ctx) {
        const expression = ctx.isSlash ? ctx.interaction.options.getString("expression", true) : ctx.args.join(" ");
        const result = safeEval(expression);
        if (result === null) {
            await ctx.reply({ embeds: [errorEmbed("Invalid or unsafe expression. Only basic math operators (+, -, *, /, %, ^, parentheses) are allowed.")] });
            return;
        }
        const embed = baseEmbed("primary").setTitle("🔢 Math Result").setDescription(`**${expression} = ${result}**`);
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=math.js.map