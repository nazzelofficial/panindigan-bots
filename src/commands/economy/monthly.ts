import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";

const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const REWARD = 10_000;

const command: CommandDefinition = {
  name: "monthly",
  description: "Claim your monthly reward of 10,000 coins",
  category: "Economy",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const user = await UserModel.findOneAndUpdate(
      { userId: ctx.userId },
      { $setOnInsert: { userId: ctx.userId } },
      { upsert: true, new: true }
    );
    let profile = user.guilds.find((g: any) => g.guildId === guild.id);
    if (!profile) {
      user.guilds.push({ guildId: guild.id } as any);
      await user.save();
      profile = user.guilds[user.guilds.length - 1];
    }

    const lastMonthly: Date | null = (profile as any).lastMonthly ?? null;
    const now = Date.now();

    if (lastMonthly && now - lastMonthly.getTime() < COOLDOWN_MS) {
      const remaining = lastMonthly.getTime() + COOLDOWN_MS - now;
      const days = Math.floor(remaining / 86_400_000);
      const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
      return ctx.reply({ embeds: [errorEmbed(`❌ You already claimed your monthly reward! Come back in **${days}d ${hours}h**.`)] });
    }

    (profile as any).balance = ((profile as any).balance ?? 0) + REWARD;
    (profile as any).lastMonthly = new Date();
    await user.save();

    const embed = baseEmbed("success")
      .setTitle("📅 Monthly Reward")
      .setDescription(`You claimed your monthly reward of **${REWARD.toLocaleString()} coins**!`)
      .addFields({ name: "💼 New Balance", value: `🪙 **${((profile as any).balance).toLocaleString()}**`, inline: true })
      .setFooter({ text: "Come back in 30 days for your next reward!" });

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
