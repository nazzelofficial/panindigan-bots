import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { baseEmbed } from "@/utils/embeds";
function checkWinner(board) {
    const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const [a, b, c] of wins)
        if (board[a] && board[a] === board[b] && board[a] === board[c])
            return board[a];
    if (board.every(Boolean))
        return "draw";
    return null;
}
function buildComponents(board, gameId, disabled = false) {
    return [0, 1, 2].map((row) => new ActionRowBuilder().addComponents([0, 1, 2].map((col) => {
        const idx = row * 3 + col;
        const cell = board[idx];
        return new ButtonBuilder()
            .setCustomId(`ttt:${gameId}:${idx}`)
            .setLabel(cell ?? "‎")
            .setStyle(cell === "X" ? ButtonStyle.Danger : cell === "O" ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(disabled || !!cell);
    })));
}
const command = {
    name: "tictactoe",
    description: "Play Tic-Tac-Toe with another member",
    category: "Games",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    aliases: ["ttt"],
    slashData: (b) => b.addUserOption((o) => o.setName("opponent").setDescription("Opponent (leave blank to play vs bot)").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const opponent = ctx.isSlash
            ? ctx.interaction.options.getUser("opponent")
            : ctx.args[0] ? await ctx.client.users.fetch(ctx.args[0].replace(/\D/g, "")).catch(() => null) : null;
        const opponentId = opponent ? (opponent.bot ? null : opponent.id) : null;
        const vsBot = !opponentId;
        const board = Array(9).fill(null);
        const gameId = `${ctx.userId}:${Date.now()}`;
        let currentTurn = "X";
        // X = challenger, O = opponent / bot
        const xId = ctx.userId;
        const oId = opponentId ?? ctx.client.user.id;
        const embed = () => baseEmbed("primary")
            .setTitle("❌⭕ Tic-Tac-Toe")
            .setDescription(`**X:** <@${xId}>\n**O:** <@${oId}>\n\nCurrent turn: **${currentTurn}** (<@${currentTurn === "X" ? xId : oId}>)`);
        const reply = await ctx.reply({ embeds: [embed()], components: buildComponents(board, gameId) });
        const handlerKey = `ttt:${xId}`;
        ctx.client.componentHandlers.set(handlerKey, async (interaction) => {
            if (!interaction.isButton())
                return;
            const [, gid, idxStr] = interaction.customId.split(":");
            if (gid !== `${xId}:${gameId.split(":")[1]}`)
                return;
            const userId = interaction.user.id;
            const validPlayer = currentTurn === "X" ? xId : oId;
            if (!vsBot && userId !== validPlayer) {
                await interaction.reply({ content: "It's not your turn!", ephemeral: true });
                return;
            }
            if (vsBot && userId !== xId) {
                await interaction.reply({ content: "This is not your game!", ephemeral: true });
                return;
            }
            const idx = parseInt(idxStr, 10);
            if (board[idx])
                return;
            board[idx] = currentTurn;
            let winner = checkWinner(board);
            if (!winner && vsBot && currentTurn === "X") {
                // Simple bot: find winning move, then block, else random
                const botMark = "O";
                const playerMark = "X";
                const tryWin = (mark) => board.findIndex((_, i) => { if (board[i])
                    return false; board[i] = mark; const w = checkWinner(board); board[i] = null; return !!w; });
                let botIdx = tryWin(botMark);
                if (botIdx === -1)
                    botIdx = tryWin(playerMark);
                if (botIdx === -1)
                    botIdx = board[4] === null ? 4 : [0, 2, 6, 8, 1, 3, 5, 7].find((i) => !board[i]) ?? -1;
                if (botIdx !== -1) {
                    board[botIdx] = "O";
                    winner = checkWinner(board);
                    currentTurn = "X";
                }
            }
            else {
                currentTurn = currentTurn === "X" ? "O" : "X";
                winner = checkWinner(board);
            }
            if (winner) {
                ctx.client.componentHandlers.delete(handlerKey);
                const title = winner === "draw" ? "🤝 Draw!" : `🏆 ${winner} Wins! (<@${winner === "X" ? xId : oId}>)`;
                await interaction.update({ embeds: [baseEmbed("success").setTitle("❌⭕ Tic-Tac-Toe").setDescription(title)], components: buildComponents(board, gameId, true) });
            }
            else {
                await interaction.update({ embeds: [embed()], components: buildComponents(board, gameId) });
            }
        });
        setTimeout(() => ctx.client.componentHandlers.delete(handlerKey), 5 * 60_000);
    },
};
export default command;
//# sourceMappingURL=tictactoe.js.map