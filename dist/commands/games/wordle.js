import { baseEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
// 50 common 5-letter words for the daily Wordle — seeded by day
const WORDS = ["crane", "slice", "brave", "ghost", "plant", "flame", "stove", "grind", "think", "blaze", "clock", "dream", "fresh", "heart", "light", "magic", "night", "ocean", "peace", "quiet", "river", "smile", "storm", "style", "tiger", "unity", "value", "water", "young", "zebra", "apple", "bread", "cloud", "dance", "earth", "fence", "grace", "happy", "index", "judge", "knife", "lemon", "mouse", "nails", "olive", "pixel", "queen", "saint", "table", "ultra"];
function getDailyWord() {
    const day = Math.floor(Date.now() / 86_400_000);
    return WORDS[day % WORDS.length];
}
const EMOJI = { correct: "🟩", present: "🟨", absent: "⬛" };
function evaluate(guess, answer) {
    const result = Array(5).fill("absent");
    const ansArr = answer.split("");
    const used = Array(5).fill(false);
    // First pass: correct positions
    for (let i = 0; i < 5; i++)
        if (guess[i] === ansArr[i]) {
            result[i] = "correct";
            used[i] = true;
        }
    // Second pass: present
    for (let i = 0; i < 5; i++) {
        if (result[i] === "correct")
            continue;
        const j = ansArr.findIndex((c, idx) => !used[idx] && c === guess[i]);
        if (j !== -1) {
            result[i] = "present";
            used[j] = true;
        }
    }
    return result;
}
// Active games: userId -> { answer, guesses, rows }
const games = new Map();
const command = {
    name: "wordle",
    description: "Play Wordle — guess today's 5-letter word in 6 tries",
    category: "Games",
    access: "general",
    guildOnly: false,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("start").setDescription("Start today's Wordle"))
        .addSubcommand((s) => s.setName("guess").setDescription("Submit a guess")
        .addStringOption((o) => o.setName("word").setDescription("Your 5-letter guess").setRequired(true).setMinLength(5).setMaxLength(5)))
        .addSubcommand((s) => s.setName("quit").setDescription("Give up and see the answer")),
    async execute(ctx) {
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "start";
        if (sub === "start") {
            if (games.has(ctx.userId)) {
                await ctx.reply({ embeds: [infoEmbed("You already have a Wordle in progress. Use `/wordle guess <word>` to continue or `/wordle quit` to stop.")] });
                return;
            }
            const answer = getDailyWord();
            games.set(ctx.userId, { answer, guesses: [], rows: [] });
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🟩 Wordle").setDescription("Wordle started! Guess today's 5-letter word.\nUse `/wordle guess <word>` to make a guess.\n\nYou have **6 tries**.\n\n🟩 = correct position\n🟨 = wrong position\n⬛ = not in word")] });
            return;
        }
        if (sub === "quit") {
            const game = games.get(ctx.userId);
            games.delete(ctx.userId);
            await ctx.reply({ embeds: [baseEmbed("danger").setTitle("🟥 Wordle — Gave Up").setDescription(`The word was **${game?.answer?.toUpperCase() ?? "N/A"}**.\n\n${game?.rows.join("\n") || "(no guesses)"}`)] });
            return;
        }
        if (sub === "guess") {
            const game = games.get(ctx.userId);
            if (!game) {
                await ctx.reply({ embeds: [infoEmbed("No active Wordle. Start one with `/wordle start`.")] });
                return;
            }
            const guess = (ctx.isSlash ? ctx.interaction.options.getString("word", true) : ctx.args[1] ?? "").toLowerCase().trim();
            if (!/^[a-z]{5}$/.test(guess)) {
                await ctx.reply({ embeds: [errorEmbed("Guess must be exactly 5 letters (a-z).")] });
                return;
            }
            const result = evaluate(guess, game.answer);
            const row = result.map((r, i) => `${EMOJI[r]}`).join("") + "  " + guess.toUpperCase().split("").join(" ");
            game.guesses.push(guess);
            game.rows.push(row);
            const won = result.every((r) => r === "correct");
            const lost = !won && game.guesses.length >= 6;
            if (won || lost)
                games.delete(ctx.userId);
            const embed = baseEmbed(won ? "success" : lost ? "danger" : "primary")
                .setTitle(`🟩 Wordle — Attempt ${game.guesses.length}/6`)
                .setDescription(game.rows.join("\n"));
            if (won)
                embed.addFields({ name: "🎉 Congrats!", value: `You got it in ${game.guesses.length} guess${game.guesses.length > 1 ? "es" : ""}!` });
            if (lost)
                embed.addFields({ name: "💔 Out of tries", value: `The word was **${game.answer.toUpperCase()}**.` });
            await ctx.reply({ embeds: [embed] });
        }
    },
};
export default command;
//# sourceMappingURL=wordle.js.map