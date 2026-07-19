import { baseEmbed, errorEmbed } from "../../utils/embeds";
function clean(text) {
    return text.replace(/\[([^\]]+)\]/g, "$1").slice(0, 1000);
}
const command = {
    name: "urban",
    description: "Find kahulugan ng isang salita sa Urban Dictionary",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 5,
    aliases: ["ud", "define"],
    slashData: (b) => b.addStringOption((o) => o.setName("word").setDescription("Salita o phrase na hahanapin").setRequired(true)),
    async execute(ctx) {
        const word = ctx.isSlash ? ctx.interaction.options.getString("word", true) : ctx.args.join(" ");
        if (!word) {
            await ctx.reply({ embeds: [errorEmbed("Provide a salita.")] });
            return;
        }
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        try {
            const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(8_000) });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const data = (await res.json());
            if (!data.list?.length) {
                await ctx.reply({ embeds: [errorEmbed(`No results found for: **${word}**`)] });
                return;
            }
            const entry = data.list[0];
            const embed = baseEmbed("primary")
                .setTitle(`📖 ${entry.word}`)
                .setURL(entry.permalink)
                .setDescription(clean(entry.definition))
                .addFields({ name: "Example", value: clean(entry.example) || "*(no example)*", inline: false }, { name: "👍 Thumbs Up", value: entry.thumbs_up.toLocaleString(), inline: true }, { name: "👎 Thumbs Down", value: entry.thumbs_down.toLocaleString(), inline: true }, { name: "Author", value: entry.author || "Anonymous", inline: true })
                .setFooter({ text: `Urban Dictionary · Written: ${new Date(entry.written_on).toLocaleDateString()}` });
            await ctx.reply({ embeds: [embed] });
        }
        catch {
            await ctx.reply({ embeds: [errorEmbed("Hindi ma-reach ang Urban Dictionary. Subukan ulit mamaya.")] });
        }
    },
};
export default command;
//# sourceMappingURL=urban.js.map