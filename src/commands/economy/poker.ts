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

// ── Card types ──────────────────────────────────────────────────────────────

type Suit = "♠️" | "♥️" | "♦️" | "♣️";
type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
interface Card { rank: Rank; suit: Suit }

const SUITS: Suit[] = ["♠️", "♥️", "♦️", "♣️"];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const RANK_LABELS: Record<Rank, string> = {
  2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10",
  11: "J", 12: "Q", 13: "K", 14: "A",
};

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  return deck;
}

function shuffle(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function label(card: Card): string {
  return `${RANK_LABELS[card.rank]}${card.suit}`;
}

// ── Hand evaluation ─────────────────────────────────────────────────────────

type HandRank =
  | "Royal Flush"
  | "Straight Flush"
  | "Four of a Kind"
  | "Full House"
  | "Flush"
  | "Straight"
  | "Three of a Kind"
  | "Two Pair"
  | "Jacks or Better"
  | "High Card";

/** Payouts as multipliers of the bet (video poker style). */
const PAYOUTS: Record<HandRank, number> = {
  "Royal Flush":    800,
  "Straight Flush":  50,
  "Four of a Kind":  25,
  "Full House":       9,
  "Flush":            6,
  "Straight":         4,
  "Three of a Kind":  3,
  "Two Pair":         2,
  "Jacks or Better":  1,
  "High Card":        0,
};

function evaluateHand(hand: Card[]): HandRank {
  const ranks = hand.map(c => c.rank).sort((a, b) => a - b);
  const suits = hand.map(c => c.suit);
  const counts: Record<number, number> = {};
  for (const r of ranks) counts[r] = (counts[r] ?? 0) + 1;
  const freq = Object.values(counts).sort((a, b) => b - a);

  const isFlush = new Set(suits).size === 1;
  const isStraight =
    ranks[4] - ranks[0] === 4 && new Set(ranks).size === 5;
  // Ace-low straight: A-2-3-4-5
  const isWheelStraight =
    JSON.stringify(ranks) === JSON.stringify([2, 3, 4, 5, 14]);

  const straightOrWheel = isStraight || isWheelStraight;

  if (isFlush && isStraight && ranks[0] === 10) return "Royal Flush";
  if (isFlush && straightOrWheel) return "Straight Flush";
  if (freq[0] === 4) return "Four of a Kind";
  if (freq[0] === 3 && freq[1] === 2) return "Full House";
  if (isFlush) return "Flush";
  if (straightOrWheel) return "Straight";
  if (freq[0] === 3) return "Three of a Kind";
  if (freq[0] === 2 && freq[1] === 2) {
    return "Two Pair";
  }
  if (freq[0] === 2) {
    const pairedRank = Number(Object.keys(counts).find(k => counts[+k] === 2));
    if (pairedRank >= 11) return "Jacks or Better";
  }
  return "High Card";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function handEmbed(
  cards: Card[],
  held: boolean[],
  phase: "deal" | "result",
  bet: number,
  handName: HandRank,
  payout: number,
  userId: string,
): EmbedBuilder {
  const cardDisplay = cards
    .map((c, i) => {
      const base = `\`${label(c)}\``;
      return held[i] ? `**${base}** 🔒` : base;
    })
    .join("  ");

  const color =
    phase === "deal"
      ? 0x5865F2
      : payout > 0
      ? 0x00c851
      : 0xff4444;

  const embed = new EmbedBuilder()
    .setTitle("🃏 Video Poker — Jacks or Better")
    .setColor(color)
    .addFields({ name: "Your Hand", value: cardDisplay, inline: false })
    .setFooter({ text: `Bet: ${bet.toLocaleString()} coins` });

  if (phase === "deal") {
    embed.setDescription(
      "**Select cards to HOLD**, then press **Draw** to replace the rest.\nYou have **30 seconds** to decide.",
    );
  } else {
    const resultLine =
      payout > 0
        ? `✅ **${handName}** — you won **${(payout * bet).toLocaleString()}** coins!`
        : `❌ **${handName}** — no win. Better luck next time!`;
    embed.setDescription(resultLine);
    embed.addFields({
      name: "📋 Pay Table",
      value: Object.entries(PAYOUTS)
        .map(([h, m]) => `${h === handName ? "▶️" : "◾"} **${h}** — ${m}x`)
        .join("\n"),
      inline: false,
    });
  }

  return embed;
}

function holdButtons(held: boolean[]): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  for (let i = 0; i < 5; i++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`hold_${i}`)
        .setLabel(held[i] ? `✅ Hold ${i + 1}` : `Hold ${i + 1}`)
        .setStyle(held[i] ? ButtonStyle.Success : ButtonStyle.Secondary),
    );
  }
  return row;
}

function drawButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("draw")
      .setLabel("🎴 Draw")
      .setStyle(ButtonStyle.Primary),
  );
}

// ── Command ──────────────────────────────────────────────────────────────────

const command: CommandDefinition = {
  name: "poker",
  description: "Play Video Poker (Jacks or Better) — hold cards, then draw for a winning hand!",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) =>
        o.setName("bet").setDescription("Amount to bet (min 10)").setRequired(true).setMinValue(10).setMaxValue(100_000)
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const bet = ctx.isSlash ? ctx.interaction!.options.getInteger("bet", true) : parseInt(ctx.args[0]);
    if (!bet) return;

    const guildId = guild.id;
    const userId = ctx.userId;

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

    if ((profile as any).balance < bet) {
      return ctx.reply({
        embeds: [errorEmbed(`❌ You don't have enough coins. Your balance: **${((profile as any).balance ?? 0).toLocaleString()}** coins.`)],
      });
    }

    // Deduct bet immediately so the player can't walk away
    (profile as any).balance = ((profile as any).balance ?? 0) - bet;
    (profile as any).totalGambled = ((profile as any).totalGambled ?? 0) + bet;
    await user.save();

    // Deal 5 cards from a shuffled deck
    const deck = shuffle(buildDeck());
    const hand: Card[] = deck.splice(0, 5);
    const held: boolean[] = [false, false, false, false, false];

    const dealEmbed = handEmbed(hand, held, "deal", bet, "High Card", 0, userId);

    const msg = await ctx.reply({
      embeds: [dealEmbed],
      components: [holdButtons(held), drawButton()],
      fetchReply: true,
    });

    // Collect hold/draw interactions for 30 seconds
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: i => i.user.id === userId,
      time: 30_000,
    });

    collector.on("collect", async btnInteraction => {
      if (btnInteraction.customId === "draw") {
        collector.stop("draw");
        return;
      }

      const idx = parseInt(btnInteraction.customId.split("_")[1], 10);
      held[idx] = !held[idx];

      const updated = handEmbed(hand, held, "deal", bet, "High Card", 0, userId);
      await btnInteraction.update({
        embeds: [updated],
        components: [holdButtons(held), drawButton()],
      });
    });

    collector.on("end", async (_, reason) => {
      // Replace non-held cards
      for (let i = 0; i < 5; i++) {
        if (!held[i]) hand[i] = deck.splice(0, 1)[0];
      }

      const handName = evaluateHand(hand);
      const multiplier = PAYOUTS[handName];
      const winAmount = multiplier * bet;

      // Credit winnings (bet was already deducted)
      const updatedUser = await UserModel.findOne({ userId });
      const updatedProfile = updatedUser?.guilds.find((g: any) => g.guildId === guildId);
      if (updatedProfile) {
        (updatedProfile as any).balance = ((updatedProfile as any).balance ?? 0) + winAmount;
        (updatedProfile as any).totalGambledWon = ((updatedProfile as any).totalGambledWon ?? 0) + winAmount;
        if (multiplier > 0) (updatedProfile as any).gamesWon = ((updatedProfile as any).gamesWon ?? 0) + 1;
        else (updatedProfile as any).gamesLost = ((updatedProfile as any).gamesLost ?? 0) + 1;
        await updatedUser?.save();
      }

      const resultEmbed = handEmbed(hand, [true, true, true, true, true], "result", bet, handName, multiplier, userId);

      const timedOut = reason === "time";
      if (timedOut) {
        resultEmbed.setFooter({ text: `Bet: ${bet.toLocaleString()} coins • Timed out — hand auto-played` });
      }

      try {
        await msg.edit({ embeds: [resultEmbed], components: [] });
      } catch {
        // Message may have been deleted
      }
    });
  },
};
export default command;
