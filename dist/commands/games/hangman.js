import { baseEmbed, errorEmbed, infoEmbed } from "../../utils/embeds";
const CATEGORIES = {
    animals: ["elephant", "kangaroo", "crocodile", "butterfly", "rhinoceros", "flamingo", "dolphin", "octopus", "penguin", "giraffe"],
    countries: ["philippines", "indonesia", "cambodia", "vietnam", "malaysia", "thailand", "myanmar", "singapore", "laos", "brunei"],
    food: ["adobo", "sinigang", "kare-kare", "lechon", "pansit", "lumpia", "halo-halo", "bibimbap", "ramen", "sushi"],
    tech: ["javascript", "typescript", "algorithm", "database", "framework", "deployment", "api", "recursion", "compiler", "network"],
};
const HANGMAN_STAGES = [
    "```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```",
    "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```",
    "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```",
    "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```",
    "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```",
    "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```",
    "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```",
];
const activeGames = new Map();
const command = {
    name: "hangman",
    description: "Play hangman — guess the word letter by letter",
    category: "Games",
    access: "general",
    guildOnly: false,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("start").setDescription("Start a new hangman game")
        .addStringOption((o) => o.setName("category").setDescription("Word category").setRequired(false)
        .addChoices(...Object.keys(CATEGORIES).map((k) => ({ name: k, value: k })))))
        .addSubcommand((s) => s.setName("guess").setDescription("Guess a letter or the full word")
        .addStringOption((o) => o.setName("letter").setDescription("Letter or full word").setRequired(true).setMaxLength(30)))
        .addSubcommand((s) => s.setName("quit").setDescription("Give up")),
    async execute(ctx) {
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "start";
        if (sub === "start") {
            if (activeGames.has(ctx.userId)) {
                await ctx.reply({ embeds: [infoEmbed("You already have a game. Guess a letter or `/hangman quit`.")] });
                return;
            }
            const catKey = ctx.isSlash ? ctx.interaction.options.getString("category") : ctx.args[1];
            const cat = catKey && CATEGORIES[catKey] ? catKey : Object.keys(CATEGORIES)[Math.floor(Math.random() * Object.keys(CATEGORIES).length)];
            const words = CATEGORIES[cat];
            const word = words[Math.floor(Math.random() * words.length)];
            activeGames.set(ctx.userId, { word, guessed: new Set(), wrong: 0 });
            const display = word.split("").map((c) => c === "-" ? "-" : "_").join(" ");
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🪢 Hangman").setDescription(`${HANGMAN_STAGES[0]}\n**Word:** ${display}\n**Category:** ${cat}`)] });
        }
        else if (sub === "guess") {
            const game = activeGames.get(ctx.userId);
            if (!game) {
                await ctx.reply({ embeds: [infoEmbed("No active game. Start with `/hangman start`.")] });
                return;
            }
            const input = (ctx.isSlash ? ctx.interaction.options.getString("letter", true) : ctx.args[1] ?? "").toLowerCase().trim();
            if (!input) {
                await ctx.reply({ embeds: [errorEmbed("Provide a letter or word.")] });
                return;
            }
            // Full word guess
            if (input.length > 1) {
                if (input === game.word) {
                    activeGames.delete(ctx.userId);
                    await ctx.reply({ embeds: [baseEmbed("success").setTitle("🎉 You Won!").setDescription(`Correct! The word was **${game.word.toUpperCase()}**.`)] });
                }
                else {
                    game.wrong++;
                    if (game.wrong >= 6) {
                        activeGames.delete(ctx.userId);
                        await ctx.reply({ embeds: [baseEmbed("danger").setTitle("💀 Hanged!").setDescription(`${HANGMAN_STAGES[6]}\nWrong word guess. The word was **${game.word.toUpperCase()}**.`)] });
                    }
                    else {
                        await ctx.reply({ embeds: [baseEmbed("danger").setTitle("❌ Wrong!").setDescription(`${HANGMAN_STAGES[game.wrong]}\nIncorrect word guess. Keep trying!`)] });
                    }
                }
                return;
            }
            const letter = input[0];
            if (!/[a-z]/.test(letter)) {
                await ctx.reply({ embeds: [errorEmbed("Please guess a letter (a-z).")] });
                return;
            }
            if (game.guessed.has(letter)) {
                await ctx.reply({ embeds: [infoEmbed(`You already guessed **${letter}**.`)] });
                return;
            }
            game.guessed.add(letter);
            const isCorrect = game.word.includes(letter);
            if (!isCorrect)
                game.wrong++;
            const display = game.word.split("").map((c) => c === "-" ? "-" : (game.guessed.has(c) ? c : "_")).join(" ");
            const won = !display.includes("_");
            const lost = game.wrong >= 6;
            if (won || lost)
                activeGames.delete(ctx.userId);
            const guessedStr = [...game.guessed].sort().join(", ");
            const embed = baseEmbed(won ? "success" : lost ? "danger" : (isCorrect ? "primary" : "warning"))
                .setTitle(`🪢 Hangman — ${won ? "🎉 Won!" : lost ? "💀 Hanged!" : (isCorrect ? "✅ Correct!" : "❌ Wrong!")}`)
                .setDescription(`${HANGMAN_STAGES[game.wrong]}\n**Word:** ${display}\n**Guessed:** ${guessedStr || "none"}\n**Wrong:** ${game.wrong}/6`);
            if (won)
                embed.addFields({ name: "The word was", value: game.word.toUpperCase() });
            if (lost)
                embed.addFields({ name: "The word was", value: game.word.toUpperCase() });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "quit") {
            const game = activeGames.get(ctx.userId);
            activeGames.delete(ctx.userId);
            await ctx.reply({ embeds: [baseEmbed("danger").setTitle("🪢 Hangman — Quit").setDescription(`The word was **${game?.word.toUpperCase() ?? "N/A"}**.`)] });
        }
    },
};
export default command;
//# sourceMappingURL=hangman.js.map