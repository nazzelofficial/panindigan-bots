import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds";
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function decodeHtml(s) {
    return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}
const command = {
    name: "trivia",
    description: "Answer a trivia question from Open Trivia DB",
    category: "Games",
    access: "general",
    guildOnly: false,
    cooldown: 10,
    slashData: (b) => b
        .addStringOption((o) => o.setName("difficulty").setDescription("Difficulty").setRequired(false)
        .addChoices({ name: "easy", value: "easy" }, { name: "medium", value: "medium" }, { name: "hard", value: "hard" })),
    async execute(ctx) {
        const difficulty = ctx.isSlash ? ctx.interaction.options.getString("difficulty") ?? "" : ctx.args[0]?.toLowerCase() ?? "";
        const url = `https://opentdb.com/api.php?amount=1&type=multiple${difficulty ? `&difficulty=${difficulty}` : ""}`;
        let question;
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            const data = await res.json();
            if (!data.results?.length)
                throw new Error("No results");
            question = data.results[0];
        }
        catch {
            await ctx.reply({ embeds: [errorEmbed("Failed to fetch trivia question from Open Trivia DB. Try again.")] });
            return;
        }
        const correct = decodeHtml(question.correct_answer);
        const options = shuffleArray([correct, ...question.incorrect_answers.map(decodeHtml)]);
        const labels = ["A", "B", "C", "D"];
        const embed = baseEmbed("primary")
            .setTitle("🧠 Trivia Question")
            .setDescription(`**${decodeHtml(question.question)}**`)
            .addFields({ name: "Category", value: question.category, inline: true }, { name: "Difficulty", value: question.difficulty, inline: true }, { name: "Options", value: options.map((o, i) => `**${labels[i]}.** ${o}`).join("\n"), inline: false })
            .setFooter({ text: "You have 30 seconds to answer!" });
        const row = new ActionRowBuilder().addComponents(options.map((o, i) => new ButtonBuilder()
            .setCustomId(`trivia:${ctx.userId}:${labels[i]}:${Buffer.from(correct).toString("base64")}`)
            .setLabel(labels[i])
            .setStyle(ButtonStyle.Primary)));
        const reply = await ctx.reply({ embeds: [embed], components: [row] });
        // Register button handler via componentHandlers
        const answerId = `trivia:${ctx.userId}`;
        ctx.client.componentHandlers.set(answerId, async (interaction) => {
            if (!interaction.isButton())
                return;
            if (interaction.user.id !== ctx.userId) {
                await interaction.reply({ content: "This isn't your trivia question!", ephemeral: true });
                return;
            }
            ctx.client.componentHandlers.delete(answerId);
            const parts = interaction.customId.split(":");
            const chosen = parts[2];
            const correctB64 = parts[3];
            const correctAnswer = Buffer.from(correctB64, "base64").toString("utf-8");
            const chosenText = options[labels.indexOf(chosen)];
            const isCorrect = chosenText === correctAnswer;
            await interaction.update({
                embeds: [
                    baseEmbed(isCorrect ? "success" : "danger")
                        .setTitle(isCorrect ? "✅ Correct!" : "❌ Incorrect!")
                        .setDescription(`**${decodeHtml(question.question)}**\n\nYour answer: **${chosenText}**\nCorrect answer: **${correctAnswer}**`),
                ],
                components: [],
            });
        });
        // Auto-expire after 30s
        setTimeout(() => {
            ctx.client.componentHandlers.delete(answerId);
        }, 30_000);
    },
};
export default command;
//# sourceMappingURL=trivia.js.map