import { baseEmbed } from "@/utils/embeds";
const CHOICES = ["rock", "paper", "scissors"];
const EMOJI = { rock: "🪨", paper: "📄", scissors: "✂️" };
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };
const command = {
    name: "rps",
    description: "Play rock-paper-scissors against the bot",
    category: "Games",
    access: "general",
    guildOnly: false,
    cooldown: 3,
    aliases: ["rockpaperscissors"],
    slashData: (b) => b.addStringOption((o) => o.setName("choice").setDescription("Your choice").setRequired(true)
        .addChoices({ name: "Rock", value: "rock" }, { name: "Paper", value: "paper" }, { name: "Scissors", value: "scissors" })),
    async execute(ctx) {
        const userChoice = (ctx.isSlash ? ctx.interaction.options.getString("choice", true) : ctx.args[0]?.toLowerCase());
        if (!CHOICES.includes(userChoice)) {
            await ctx.reply("Choose: rock, paper, or scissors.");
            return;
        }
        const botChoice = CHOICES[Math.floor(Math.random() * 3)];
        let result;
        let color;
        if (userChoice === botChoice) {
            result = "It's a **tie**!";
            color = "warning";
        }
        else if (BEATS[userChoice] === botChoice) {
            result = "You **win**! 🎉";
            color = "success";
        }
        else {
            result = "You **lose**! 😢";
            color = "danger";
        }
        await ctx.reply({
            embeds: [
                baseEmbed(color)
                    .setTitle("✂️ Rock Paper Scissors")
                    .addFields({ name: "You", value: `${EMOJI[userChoice]} ${userChoice}`, inline: true }, { name: "Bot", value: `${EMOJI[botChoice]} ${botChoice}`, inline: true }, { name: "Result", value: result, inline: false }),
            ],
        });
    },
};
export default command;
//# sourceMappingURL=rps.js.map