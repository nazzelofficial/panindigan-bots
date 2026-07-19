import { baseEmbed, errorEmbed } from "../../utils/embeds";
import { scopedLogger } from "../../utils/logger";
const log = scopedLogger("eval");
function clean(text) {
    return String(text).replace(/`/g, "`\u200B").replace(/@/g, "@\u200B").slice(0, 1950);
}
const command = {
    name: "eval",
    description: "Evaluate arbitrary JavaScript (owner only — DANGEROUS)",
    category: "Owner",
    access: "owner",
    guildOnly: false,
    cooldown: 0,
    slashData: (b) => b
        .addStringOption((o) => o.setName("code").setDescription("Code to evaluate").setRequired(true))
        .addBooleanOption((o) => o.setName("async").setDescription("Wrap in async IIFE").setRequired(false))
        .addBooleanOption((o) => o.setName("silent").setDescription("Suppress output").setRequired(false)),
    async execute(ctx) {
        const code = ctx.isSlash ? ctx.interaction.options.getString("code", true) : ctx.args.join(" ");
        const asAsync = ctx.isSlash ? ctx.interaction.options.getBoolean("async") ?? false : false;
        const silent = ctx.isSlash ? ctx.interaction.options.getBoolean("silent") ?? false : false;
        if (!code) {
            await ctx.reply({ embeds: [errorEmbed("Provide code to evaluate.")] });
            return;
        }
        const startTime = Date.now();
        let output;
        let isError = false;
        try {
            // eslint-disable-next-line no-eval
            let result = asAsync ? await eval(`(async () => { ${code} })()`) : eval(code);
            if (result !== null && typeof result === "object")
                result = JSON.stringify(result, null, 2);
            output = clean(result);
        }
        catch (err) {
            output = clean(err.message ?? String(err));
            isError = true;
        }
        const elapsed = Date.now() - startTime;
        log[isError ? "warn" : "debug"](`Eval by ${ctx.userId}: ${code.slice(0, 100)}`);
        if (silent && !isError) {
            await ctx.reply({ embeds: [baseEmbed("success").setTitle("✅ Eval completed (silent)")] });
            return;
        }
        const embed = baseEmbed(isError ? "danger" : "success")
            .setTitle(isError ? "❌ Eval Error" : "✅ Eval Result")
            .addFields({ name: "Input", value: `\`\`\`js\n${code.slice(0, 1000)}\`\`\``, inline: false }, { name: "Output", value: `\`\`\`js\n${output.slice(0, 1000)}\`\`\``, inline: false })
            .setFooter({ text: `Executed in ${elapsed}ms` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=eval.js.map