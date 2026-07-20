import { EmbedFactory } from "../../structures/EmbedFactory.js";
import { commandRegistry } from "../../structures/CommandRegistry.js";
const command = {
    name: "parity",
    description: "Generate a command parity report (Owner only)",
    category: "Owner",
    access: "owner",
    guildOnly: false,
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        const report = commandRegistry.validateParity();
        const embed = EmbedFactory.base("primary")
            .setTitle("📊 Command Parity Report")
            .setDescription("Analysis of prefix and slash command support")
            .addFields({ name: "✅ Both Prefix & Slash", value: `${report.both.length} commands`, inline: true }, { name: "⚠️ Prefix Only", value: `${report.prefixOnly.length} commands`, inline: true }, { name: "⚠️ Slash Only", value: `${report.slashOnly.length} commands`, inline: true });
        if (report.prefixOnly.length > 0) {
            embed.addFields({
                name: "Missing Slash Implementations",
                value: report.prefixOnly.map(c => `\`${c}\``).join(", ") || "None",
                inline: false,
            });
        }
        if (report.slashOnly.length > 0) {
            embed.addFields({
                name: "Missing Prefix Implementations",
                value: report.slashOnly.map(c => `\`${c}\``).join(", ") || "None",
                inline: false,
            });
        }
        embed.addFields({
            name: "Total Commands",
            value: `${report.both.length + report.prefixOnly.length + report.slashOnly.length}`,
            inline: true,
        });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=parity.js.map