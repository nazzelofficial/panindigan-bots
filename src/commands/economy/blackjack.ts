import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { errorEmbed } from "../../utils/embeds.js";

// ── Cards ────────────────────────────────────────────────────────────────────
type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
interface Card { rank: Rank; suit: Suit }

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function buildDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ rank: r, suit: s });
  return d;
}

function shuffle(d: Card[]): Card[] {
  const a = [...d];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardValue(rank: Rank): number {
  if (["J","Q","K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank, 10);
}

function handTotal(hand: Card[]): number {
  let total = hand.reduce((s, c) => s + cardValue(c.rank), 0);
  let aces = hand.filter(c => c.rank === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function fmt(c: Card): string { return `\`${c.rank}${c.suit}\``; }
function fmtHand(hand: Card[]): string { return hand.map(fmt).join(" "); }

function buildEmbed(
  playerHand: Card[],
  dealerHand: Card[],
  phase: "play" | "result",
  outcome: string,
  bet: number,
  color: number,
): EmbedBuilder {
  const playerTotal = handTotal(playerHand);
  const dealerVisible = phase === "play" ? [dealerHand[0]] : dealerHand;
  const dealerTotal = phase === "play" ? cardValue(dealerHand[0].rank) : handTotal(dealerHand);
  const dealerDisplay = phase === "play"
    ? `${fmt(dealerHand[0])} \`??\``
    : fmtHand(dealerHand);

  return new EmbedBuilder()
    .setTitle("🃏 Blackjack")
    .setColor(color)
    .addFields(
      { name: `Your Hand (${playerTotal})`, value: fmtHand(playerHand), inline: false },
      { name: `Dealer's Hand (${dealerTotal}${phase === "play" ? "+" : ""})`, value: dealerDisplay, inline: false },
    )
    .setDescription(phase === "play" ? outcome : `**${outcome}**`)
    .setFooter({ text: `Bet: ${bet.toLocaleString()} coins` })
    .setTimestamp();
}

const command: CommandDefinition = {
  name: "blackjack",
  description: "Play Blackjack — get closer to 21 than the dealer without busting!",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addIntegerOption((o) =>
      o.setName("bet").setDescription("Amount to bet (min 10)").setRequired(true).setMinValue(10).setMaxValue(100_000)
    ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const bet = ctx.isSlash ? ctx.interaction!.options.getInteger("bet", true) : parseInt(ctx.args[0]);
    if (!bet) return;

    const userId = ctx.userId;
    const guildId = guild.id;

    const user = await UserModel.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true }
    );
    let profile = user.guilds.find((g: any) => g.guildId === guildId);
    if (!profile) {
      user.guilds.push({ guildId } as any);
      await user.save();
      profile = user.guilds[user.guilds.length - 1];
    }

    const balance = (profile as any).balance ?? 0;
    if (balance < bet) {
      return ctx.reply({ embeds: [errorEmbed(`❌ Insufficient balance. You have **${balance.toLocaleString()}** coins.`)] });
    }

    (profile as any).balance = balance - bet;
    await user.save();

    const deck = shuffle(buildDeck());
    const playerHand: Card[] = [deck.pop()!, deck.pop()!];
    const dealerHand: Card[] = [deck.pop()!, deck.pop()!];

    // Check natural blackjack
    if (handTotal(playerHand) === 21) {
      const dealerTotal = handTotal(dealerHand);
      if (dealerTotal === 21) {
        // Push — return bet
        (profile as any).balance = ((profile as any).balance ?? 0) + bet;
        await user.save();
        return ctx.reply({ embeds: [buildEmbed(playerHand, dealerHand, "result", "🤝 Push — Natural Blackjack both sides! Bet returned.", bet, 0xFFAA00)] });
      }
      const payout = Math.floor(bet * 2.5); // 3:2 payout
      (profile as any).balance = ((profile as any).balance ?? 0) + payout;
      await user.save();
      return ctx.reply({ embeds: [buildEmbed(playerHand, dealerHand, "result", `🎉 Blackjack! You won **${payout.toLocaleString()}** coins (3:2)!`, bet, 0x00C851)] });
    }

    const hitBtn = new ButtonBuilder().setCustomId("bj_hit").setLabel("Hit").setStyle(ButtonStyle.Primary);
    const standBtn = new ButtonBuilder().setCustomId("bj_stand").setLabel("Stand").setStyle(ButtonStyle.Secondary);
    const doubleBtn = new ButtonBuilder()
      .setCustomId("bj_double")
      .setLabel("Double Down")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(balance - bet < bet);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(hitBtn, standBtn, doubleBtn);
    const msg = await ctx.reply({
      embeds: [buildEmbed(playerHand, dealerHand, "play", "Hit, Stand, or Double Down?", bet, 0x5865F2)],
      components: [row],
      fetchReply: true,
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i: any) => i.user.id === userId,
      time: 30_000,
    });

    let currentBet = bet;
    let doubled = false;

    const settle = async (finalPlayer: Card[]) => {
      // Dealer plays
      while (handTotal(dealerHand) < 17) dealerHand.push(deck.pop()!);
      const pTotal = handTotal(finalPlayer);
      const dTotal = handTotal(dealerHand);

      let outcome: string;
      let color: number;
      let payout = 0;

      const updatedUser = await UserModel.findOne({ userId });
      const updatedProfile = updatedUser?.guilds.find((g: any) => g.guildId === guildId);
      if (!updatedProfile) return;

      if (pTotal > 21) {
        outcome = `💥 Bust! You lost **${currentBet.toLocaleString()}** coins.`;
        color = 0xFF4444;
      } else if (dTotal > 21) {
        payout = currentBet * 2;
        (updatedProfile as any).balance = ((updatedProfile as any).balance ?? 0) + payout;
        await updatedUser?.save();
        outcome = `🎉 Dealer busts! You won **${currentBet.toLocaleString()}** coins!`;
        color = 0x00C851;
      } else if (pTotal > dTotal) {
        payout = currentBet * 2;
        (updatedProfile as any).balance = ((updatedProfile as any).balance ?? 0) + payout;
        await updatedUser?.save();
        outcome = `🎉 You win! You won **${currentBet.toLocaleString()}** coins!`;
        color = 0x00C851;
      } else if (dTotal > pTotal) {
        outcome = `❌ Dealer wins. You lost **${currentBet.toLocaleString()}** coins.`;
        color = 0xFF4444;
      } else {
        // Push
        (updatedProfile as any).balance = ((updatedProfile as any).balance ?? 0) + currentBet;
        await updatedUser?.save();
        outcome = `🤝 Push! Bet returned.`;
        color = 0xFFAA00;
      }

      await msg.edit({ embeds: [buildEmbed(finalPlayer, dealerHand, "result", outcome, currentBet, color)], components: [] });
    };

    collector.on("collect", async (btn: any) => {
      if (btn.customId === "bj_hit") {
        playerHand.push(deck.pop()!);
        await btn.deferUpdate();
        if (handTotal(playerHand) >= 21) {
          collector.stop("done");
          await settle(playerHand);
        } else {
          await msg.edit({ embeds: [buildEmbed(playerHand, dealerHand, "play", "Hit, Stand, or Double Down?", currentBet, 0x5865F2)] });
        }
      } else if (btn.customId === "bj_stand") {
        await btn.deferUpdate();
        collector.stop("done");
        await settle(playerHand);
      } else if (btn.customId === "bj_double") {
        const updatedUser = await UserModel.findOne({ userId });
        const updatedProfile = updatedUser?.guilds.find((g: any) => g.guildId === guildId);
        if (!updatedProfile) return;
        const bal = (updatedProfile as any).balance ?? 0;
        if (bal < currentBet) {
          await btn.reply({ content: "❌ Not enough coins to double down.", ephemeral: true });
          return;
        }
        (updatedProfile as any).balance = bal - currentBet;
        await updatedUser?.save();
        currentBet *= 2;
        doubled = true;
        playerHand.push(deck.pop()!);
        await btn.deferUpdate();
        collector.stop("done");
        await settle(playerHand);
      }
    });

    collector.on("end", async (_: any, reason: string) => {
      if (reason !== "done") {
        // Timed out — auto-stand
        await settle(playerHand);
      }
    });
  },
};
export default command;
