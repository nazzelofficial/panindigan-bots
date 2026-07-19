import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "lottery_draw",
  description: "Draw the lottery (admin only)",
  category: "Economy",
  access: "admin",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const users = await UserModel.find().lean();
    const participants: any[] = [];
    let totalTickets = 0;

    for (const user of users) {
      const profile = (user as any).guilds?.find((g: any) => g.guildId === guild.id);
      if (profile && (profile.lotteryTickets || 0) > 0) {
        participants.push({ userId: user.userId, tickets: profile.lotteryTickets });
        totalTickets += profile.lotteryTickets;
      }
    }

    if (participants.length === 0) {
      return ctx.reply({ embeds: [errorEmbed("❌ No lottery tickets sold")] });
    }

    // Weighted random selection based on ticket count
    let roll = Math.random() * totalTickets;
    let winner = participants[0];
    for (const participant of participants) {
      roll -= participant.tickets;
      if (roll <= 0) {
        winner = participant;
        break;
      }
    }

    const prize = totalTickets * 50;

    // Update winner's balance and reset all tickets
    const winnerUser = await UserModel.findOne({ userId: winner.userId });
    if (winnerUser) {
      const winnerProfile = winnerUser.guilds.find((g: any) => g.guildId === guild.id);
      if (winnerProfile) {
        (winnerProfile as any).balance = ((winnerProfile as any).balance ?? 0) + prize;
        (winnerProfile as any).lotteryTickets = 0;
      }
    }

    // Reset all lottery tickets in the guild
    for (const user of users) {
      const profile = (user as any).guilds?.find((g: any) => g.guildId === guild.id);
      if (profile) {
        await UserModel.updateOne(
          { userId: user.userId, "guilds.guildId": guild.id },
          { $set: { "guilds.$.lotteryTickets": 0 } }
        );
      }
    }

    const embed = baseEmbed("success")
      .setTitle("🎰 Lottery Results")
      .setDescription(`Winner: <@${winner.userId}>\nPrize: 🪙 **${prize.toLocaleString()}**`);

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
