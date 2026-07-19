import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";
import { config } from "@/config/config";

const DAILY_COOLDOWN_MS = 22 * 60 * 60 * 1000; // 22 hours

const command: CommandDefinition = {
  name: "daily",
  description: "Claim your daily coin reward",
  category: "Economy",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["claim"],
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const user = await UserModel.findOneAndUpdate(
      { userId: ctx.userId },
      { $setOnInsert: { userId: ctx.userId } },
      { upsert: true, new: true },
    );

    let profile = user.guilds.find((g: any) => g.guildId === guild.id);
    if (!profile) {
      user.guilds.push({ guildId: guild.id } as any);
      await user.save();
      profile = user.guilds[user.guilds.length - 1];
    }

    const lastDaily: Date | null = (profile as any).lastDaily;
    const now = Date.now();

    if (lastDaily && now - lastDaily.getTime() < DAILY_COOLDOWN_MS) {
      const remaining = lastDaily.getTime() + DAILY_COOLDOWN_MS - now;
      const h = Math.floor(remaining / 3_600_000);
      const m = Math.floor((remaining % 3_600_000) / 60_000);
      await ctx.reply({ embeds: [errorEmbed(`Daily already claimed. Come back in **${h}h ${m}m**.`)] });
      return;
    }

    // Streak logic
    const oneDayMs = 24 * 60 * 60 * 1000;
    let streak: number = (profile as any).streak ?? 0;
    if (lastDaily && now - lastDaily.getTime() < oneDayMs * 2) {
      streak = Math.min(streak + 1, 30);
    } else {
      streak = 1;
    }
    (profile as any).streak = streak;

    const baseAmount: number = (config as any).economy?.dailyAmount ?? 500;
    const multiplier = (config as any).economy?.dailyStreakMultiplier ?? 0.02;
    const bonus = Math.round(baseAmount * multiplier * (streak - 1));
    const totalAmount = baseAmount + bonus;
    const guildMultiplier: number = 1; // can be extended from guild config

    const reward = Math.round(totalAmount * guildMultiplier);
    (profile as any).balance = ((profile as any).balance ?? 0) + reward;
    (profile as any).lastDaily = new Date();
    (profile as any).totalEarned = ((profile as any).totalEarned ?? 0) + reward;
    await user.save();

    const embed = baseEmbed("success")
      .setTitle("📅 Daily Reward Claimed!")
      .addFields(
        { name: "Reward", value: `🪙 **+${reward.toLocaleString()}**`, inline: true },
        { name: "Streak", value: `🔥 **${streak} day${streak !== 1 ? "s" : ""}**`, inline: true },
        { name: "Streak Bonus", value: bonus > 0 ? `🪙 +${bonus.toLocaleString()}` : "None", inline: true },
        { name: "New Balance", value: `🪙 **${((profile as any).balance).toLocaleString()}**`, inline: true },
      )
      .setFooter({ text: "Come back tomorrow to keep your streak!" });

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
