import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { baseEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";
const ROWS = 6;
const COLS = 7;
const EMPTY = "⚫";
const P1 = "🔴";
const P2 = "🟡";
function makeBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(""));
}
function renderBoard(board) {
    const colNums = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"].join("");
    const rows = board.map((row) => row.map((c) => (c === "1" ? P1 : c === "2" ? P2 : EMPTY)).join(""));
    return colNums + "\n" + rows.join("\n");
}
function dropPiece(board, col, player) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (!board[r][col]) {
            board[r][col] = player;
            return r;
        }
    }
    return -1;
}
function checkWin(board, p) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] !== p)
                continue;
            const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
            for (const [dr, dc] of dirs) {
                let count = 1;
                for (let k = 1; k < 4; k++) {
                    const nr = r + dr * k, nc = c + dc * k;
                    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== p)
                        break;
                    count++;
                }
                if (count >= 4)
                    return true;
            }
        }
    }
    return false;
}
function makeButtons(board) {
    const rows = [];
    const cols1 = [0, 1, 2, 3].map((c) => new ButtonBuilder().setCustomId(`c4:${c}`).setLabel(`${c + 1}`).setStyle(ButtonStyle.Primary).setDisabled(board[0][c] !== ""));
    const cols2 = [4, 5, 6].map((c) => new ButtonBuilder().setCustomId(`c4:${c}`).setLabel(`${c + 1}`).setStyle(ButtonStyle.Primary).setDisabled(board[0][c] !== ""));
    rows.push(new ActionRowBuilder().addComponents(cols1));
    rows.push(new ActionRowBuilder().addComponents(cols2));
    return rows;
}
const command = {
    name: "connect4",
    description: "Maglaro ng Connect 4 laban sa isa pang player",
    category: "Games",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    aliases: ["c4"],
    slashData: (b) => b.addUserOption((o) => o.setName("opponent").setDescription("Kalaban (mag-iiwan ng blank para laro vs bot)").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const opp = ctx.isSlash
            ? ctx.interaction.options.getUser("opponent")
            : ctx.message ? await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, "") ?? "").catch(() => null) : null;
        const p1Id = ctx.userId;
        const p2Id = opp?.id ?? ctx.client.user.id;
        const vsBot = !opp || opp.id === ctx.client.user.id;
        if (!vsBot && opp.bot) {
            await ctx.reply({ embeds: [errorEmbed("You cannot play against another bot.")] });
            return;
        }
        if (!vsBot && opp.id === p1Id) {
            await ctx.reply({ embeds: [errorEmbed("Hindi ka makakalaro laban sa iyong sarili.")] });
            return;
        }
        const board = makeBoard();
        let currentPlayer = "1";
        let moveCount = 0;
        const embed = () => baseEmbed("primary")
            .setTitle("🔴🟡 Connect 4")
            .setDescription(renderBoard(board))
            .addFields({ name: P1 + " Player 1", value: `<@${p1Id}>`, inline: true }, { name: P2 + " Player 2", value: vsBot ? "Bot 🤖" : `<@${p2Id}>`, inline: true }, { name: "Turn", value: currentPlayer === "1" ? `<@${p1Id}>'s turn ${P1}` : vsBot ? `Bot's turn ${P2}` : `<@${p2Id}>'s turn ${P2}`, inline: false });
        const msg = await ctx.reply({ embeds: [embed()], components: makeButtons(board), fetchReply: true });
        if (!msg)
            return;
        const filter = (i) => {
            if (!i.customId.startsWith("c4:"))
                return false;
            if (currentPlayer === "1" && i.user.id !== p1Id) {
                i.reply({ embeds: [infoEmbed("It is not your turn.")], ephemeral: true });
                return false;
            }
            if (currentPlayer === "2" && !vsBot && i.user.id !== p2Id) {
                i.reply({ embeds: [infoEmbed("It is not your turn.")], ephemeral: true });
                return false;
            }
            return currentPlayer === "1" || (currentPlayer === "2" && !vsBot);
        };
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, filter, time: 120_000 });
        const botMove = async () => {
            // Simple bot: pick random valid column
            const valid = Array.from({ length: COLS }, (_, i) => i).filter((c) => board[0][c] === "");
            if (!valid.length)
                return;
            const col = valid[Math.floor(Math.random() * valid.length)];
            dropPiece(board, col, "2");
            moveCount++;
            const won = checkWin(board, "2");
            const full = board[0].every((c) => c !== "");
            if (won || full) {
                collector.stop();
                await msg.edit({
                    embeds: [embed().setDescription(renderBoard(board)).addFields({ name: "Resulta", value: won ? `🤖 Bot ang nanalo!` : "🤝 Draw!" })],
                    components: [],
                });
                return;
            }
            currentPlayer = "1";
            await msg.edit({ embeds: [embed()], components: makeButtons(board) });
        };
        collector.on("collect", async (i) => {
            const col = parseInt(i.customId.split(":")[1]);
            if (board[0][col] !== "") {
                await i.reply({ embeds: [infoEmbed("Puno na ang column na iyan.")], ephemeral: true });
                return;
            }
            await i.deferUpdate();
            dropPiece(board, col, currentPlayer);
            moveCount++;
            const won = checkWin(board, currentPlayer);
            const full = board[0].every((c) => c !== "");
            if (won || full) {
                collector.stop("done");
                const winnerId = currentPlayer === "1" ? p1Id : p2Id;
                await msg.edit({
                    embeds: [embed().setDescription(renderBoard(board)).addFields({ name: "Resulta", value: won ? `🎉 <@${winnerId}> ang **nanalo**!` : "🤝 **Draw!** Puno ang board." })],
                    components: [],
                });
                return;
            }
            currentPlayer = currentPlayer === "1" ? "2" : "1";
            if (vsBot && currentPlayer === "2") {
                await msg.edit({ embeds: [embed()], components: makeButtons(board) });
                setTimeout(botMove, 800);
            }
            else {
                await msg.edit({ embeds: [embed()], components: makeButtons(board) });
            }
        });
        collector.on("end", async (_, reason) => {
            if (reason !== "done") {
                await msg.edit({ embeds: [embed().addFields({ name: "Game Over", value: "Nag-expire ang laro dahil walang aksyon." })], components: [] }).catch(() => { });
            }
        });
    },
};
export default command;
//# sourceMappingURL=connect4.js.map