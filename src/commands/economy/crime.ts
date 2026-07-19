import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed, warnEmbed, baseEmbed } from "@/utils/embeds";

const CRIME_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
const SUCCESS_CHANCE = 0.55;

const CRIME_SUCCESS = [
  "You robbed a convenience store and got away clean.",
  "A daring heist on the local bank — you made it!",
  "You pickpocketed a wealthy tourist.",
  "You sold stolen goods at the black market.",
  "A quick smash-and-grab at the jewelry store.",
  "You hacked into someone's account and drained it.",
];

const CRIME_FAIL = [
  "You got caught red-handed! The police fined you.",
  "Your partner ratted you out. You paid a settlement.",
  "Security cameras caught everything. You paid the fine.",
  "You tripped during the getaway. Embarrassing and costly.",
];

const command: CommandDefinition = {
  name: "crime",
  description: "Commit a crime for high-risk coins (or get caught and fined)",
  category: "Economy",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["rob-store", "heist"],
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

    const lastCrime: Date | null = (profile as any).lastCrime;
    const now = Date.now();
    if (lastCrime && now - lastCrime.getTime() < CRIME_COOLDOWN_MS) {
      const remaining = lastCrime.getTime() + CRIME_COOLDOWN_MS - now;
      const m = Math.floor(remaining / 60_000);
      await ctx.reply({ embeds: [errorEmbed(`Lay low for **${m}m** before committing another crime.`)] });
      return;
    }

    (profile as any).lastCrime = new Date();
    const success = Math.random() < SUCCESS_CHANCE;

    if (success) {
      const earned = Math.floor(Math.random() * 601) + 300; // 300-900
      (profile as any).balance = ((profile as any).balance ?? 0) + earned;
      (profile as any).totalEarned = ((profile as any).totalEarned ?? 0) + earned;
      await user.save();
      const msg = CRIME_SUCCESS[Math.floor(Math.random() * CRIME_SUCCESS.length)];
      await ctx.reply({ embeds: [baseEmbed("success").setTitle("🕵️ Crime Successful!").setDescription(`${msg}\n\n💰 You earned **${earned.toLocaleString()} coins**.`)] });
    } else {
      const fine = Math.floor(Math.random() * 301) + 100; // 100-400
      const wallet: number = (profile as any).balance ?? 0;
      (profile as any).balance = Math.max(0, wallet - fine);
      (profile as any).totalSpent = ((profile as any).totalSpent ?? 0) + Math.min(fine, wallet);
      await user.save();
      const msg = CRIME_FAIL[Math.floor(Math.random() * CRIME_FAIL.length)];
      await ctx.reply({ embeds: [warnEmbed(`🚔 ${msg}\n\n💸 You were fined **${fine.toLocaleString()} coins**.`)] });
    }
  },
};

export default command;
