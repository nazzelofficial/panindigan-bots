import { baseEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "timestamp",
    description: "Create Discord timestamp mula sa petsa/oras",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 3,
    aliases: ["ts", "time2unix"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("datetime").setDescription("Petsa/oras (e.g. '2025-12-25 18:00', 'tomorrow', 'now')").setRequired(false))
        .addStringOption((o) => o.setName("format").setDescription("Discord timestamp format").setRequired(false)
        .addChoices({ name: "Short Time (3:00 PM)", value: "t" }, { name: "Long Time (3:00:00 PM)", value: "T" }, { name: "Short Date (01/01/2025)", value: "d" }, { name: "Long Date (January 1, 2025)", value: "D" }, { name: "Short Date+Time (default)", value: "f" }, { name: "Long Date+Time", value: "F" }, { name: "Relative (in 5 hours)", value: "R" })),
    async execute(ctx) {
        const input = ctx.isSlash ? (ctx.interaction.options.getString("datetime") ?? "now") : (ctx.args.join(" ") || "now");
        const format = (ctx.isSlash ? ctx.interaction.options.getString("format") : null) ?? "f";
        let date;
        if (!input || input.toLowerCase() === "now") {
            date = new Date();
        }
        else if (input.toLowerCase() === "tomorrow") {
            date = new Date(Date.now() + 86_400_000);
        }
        else if (input.toLowerCase() === "yesterday") {
            date = new Date(Date.now() - 86_400_000);
        }
        else {
            date = new Date(input);
            if (isNaN(date.getTime())) {
                // Try common formats
                const parsed = Date.parse(input.replace(/\//g, "-"));
                if (!isNaN(parsed))
                    date = new Date(parsed);
                else {
                    await ctx.reply({ embeds: [errorEmbed(`Hindi ma-parse ang petsa: \`${input}\`\n\nUse format: \`2025-12-25\`, \`2025-12-25 18:00\`, o \`now\`.`)] });
                    return;
                }
            }
        }
        const unix = Math.floor(date.getTime() / 1000);
        const allFormats = ["t", "T", "d", "D", "f", "F", "R"];
        const embed = baseEmbed("primary")
            .setTitle("⏱️ Discord Timestamp")
            .addFields({ name: "Unix Timestamp", value: `\`${unix}\``, inline: true }, { name: "ISO 8601", value: `\`${date.toISOString()}\``, inline: true }, { name: "Selected Format", value: `\`<t:${unix}:${format}>\` → <t:${unix}:${format}>`, inline: false }, { name: "All Formats", value: allFormats.map((f) => `\`<t:${unix}:${f}>\` → <t:${unix}:${f}>`).join("\n"), inline: false })
            .setFooter({ text: "I-copy ang format code at i-paste sa Discord message mo!" });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=timestamp.js.map