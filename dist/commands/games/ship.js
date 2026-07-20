import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
function getCompatibility(id1, id2) {
    // Deterministic from both IDs so it's consistent per pair
    const combined = [id1, id2].sort().join("");
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        hash = (hash * 31 + combined.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash % 101); // 0-100
}
function getShipStatus(score) {
    if (score >= 90)
        return { emoji: "💘", label: "PERFECT MATCH", desc: "Soulmates! Tadhana na ang nag-utos." };
    if (score >= 75)
        return { emoji: "❤️", label: "VERY COMPATIBLE", desc: "Maganda ang chemistry! May pag-asa." };
    if (score >= 60)
        return { emoji: "🧡", label: "COMPATIBLE", desc: "May potensyal! Subukan na lang." };
    if (score >= 45)
        return { emoji: "💛", label: "FRIENDS ZONE", desc: "Magagandang kaibigan, pero siguro hanggang doon lang." };
    if (score >= 30)
        return { emoji: "💚", label: "OKAY LANG", desc: "Baka kailangan pang mas makilala ang isa't isa." };
    if (score >= 15)
        return { emoji: "🤍", label: "UNLIKELY", desc: "Malabo, pero hindi imposible?" };
    return { emoji: "💔", label: "NO MATCH", desc: "These two are just not meant to be." };
}
function buildBar(score) {
    const filled = Math.round(score / 10);
    return "❤️".repeat(filled) + "🖤".repeat(10 - filled);
}
const command = {
    name: "ship",
    description: "Calculate the compatibility score between two members — just for fun!",
    category: "Games",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["compatibility", "love"],
    slashData: (b) => b
        .addUserOption((o) => o.setName("user1").setDescription("First user").setRequired(true))
        .addUserOption((o) => o.setName("user2").setDescription("Second user (defaults to you)").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        let u1 = ctx.isSlash ? ctx.interaction.options.getUser("user1", true) : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, "") ?? "").catch(() => null);
        let u2 = ctx.isSlash ? ctx.interaction.options.getUser("user2") : ctx.args[1] ? await ctx.client.users.fetch(ctx.args[1]?.replace(/\D/g, "") ?? "").catch(() => null) : null;
        if (!u1) {
            await ctx.reply({ embeds: [errorEmbed("User not found.")] });
            return;
        }
        if (!u2)
            u2 = await ctx.client.users.fetch(ctx.userId);
        if (u1.id === u2.id) {
            await ctx.reply({ embeds: [errorEmbed("You need to ship two different users!")] });
            return;
        }
        const score = getCompatibility(u1.id, u2.id);
        const { emoji, label, desc } = getShipStatus(score);
        const bar = buildBar(score);
        const shipName = u1.displayName.slice(0, Math.ceil(u1.displayName.length / 2)) +
            u2.displayName.slice(Math.floor(u2.displayName.length / 2));
        const embed = baseEmbed("primary")
            .setTitle(`${emoji} Ship Score`)
            .setDescription(`**${u1.displayName}** 💕 **${u2.displayName}**\n\n${bar}\n\n**${score}% — ${label}**\n*${desc}*`)
            .addFields({ name: "Ship Name", value: `💑 **${shipName}**`, inline: true }, { name: "Score", value: `**${score}/100**`, inline: true })
            .setFooter({ text: "Para sa saya lang — walang seryoso! 😄" });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=ship.js.map