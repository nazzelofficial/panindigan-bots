import cron from "node-cron";
import type { PanindiganClient } from "../../structures/Client.js";
import { GiveawayModel } from "../../database/models/Community.js";
import { baseEmbed } from "../../utils/embeds.js";
import { scopedLogger } from "../../utils/logger.js";

const log = scopedLogger("scheduler:giveaways");

function pickWinners(participants: string[], count: number): string[] {
  const pool = [...participants];
  const winners: string[] = [];
  while (pool.length && winners.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(index, 1)[0]);
  }
  return winners;
}

/** Ends due giveaways every 15 seconds, rolls winners, and announces them. */
export function startGiveawayScheduler(client: PanindiganClient): void {
  cron.schedule("*/15 * * * * *", async () => {
    try {
      const due = await GiveawayModel.find({ ended: false, endsAt: { $lte: new Date() } });
      for (const giveaway of due) {
        giveaway.ended = true;
        const winners = pickWinners(giveaway.participants, giveaway.winnerCount);
        giveaway.winners = winners;
        await giveaway.save();

        const channel = client.channels.cache.get(giveaway.channelId);
        if (channel?.isTextBased()) {
          const description = winners.length
            ? `Congratulations ${winners.map((w) => `<@${w}>`).join(", ")}! You won **${giveaway.prize}**!`
            : "No valid entries — no winner could be determined.";
          await (channel as any).send({ embeds: [baseEmbed("premium").setTitle("🎉 Giveaway Ended!").setDescription(description)] }).catch(() => {});
        }
      }
    } catch (err: any) {
      log.error("Giveaway sweep failed", { error: err.message });
    }
  });
}
