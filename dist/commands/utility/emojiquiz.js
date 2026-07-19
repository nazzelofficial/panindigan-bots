import { baseEmbed } from "@/utils/embeds";
const command = {
    name: "emojiquiz",
    description: "Guess the word from emojis",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        const quizzes = [
            { emojis: "👁️🇺🇸", answer: "I see" },
            { emojis: "🔥🔥", answer: "Fire fire" },
            { emojis: "🌧️☔", answer: "Rain umbrella" },
        ];
        const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
        const embed = baseEmbed("primary")
            .setTitle("😀 Emoji Quiz")
            .setDescription(quiz.emojis)
            .setFooter({ text: "Guess the phrase!" })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=emojiquiz.js.map