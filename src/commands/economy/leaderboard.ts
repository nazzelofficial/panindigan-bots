import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { UserModel } from "@/database/models/User";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "economyleaderboard",
  description: "View the top richest members by coin balance",
  category: "Economy",
  access: "general",
  guildOnly: true,
  cooldown: 30,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const users = await UserModel.find().lean();
    const ranked = users
      .map((u: any) => {
        const profile = u.guilds?.find((g: any) => g.guildId === guild.id);
        return { userId: u.userId, balance: profile?.balance ?? 0 };
      })
      .filter((u: any) => u.balance > 0)
      .sort((a: any, b: any) => b.balance - a.balance)
      .slice(0, 10);

    const leaderboard = ranked.map((u: any, i: number) => `**${i + 1}.** <@${u.userId}> — 🪙 **${u.balance.toLocaleString()}**`).join("\n");

    const embed = baseEmbed("primary")
      .setTitle("🏆 Economy Leaderboard")
      .setDescription(leaderboard || "No users with coins yet")
      .setFooter({ text: `Showing top 10 richest users in ${guild.name}` });

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
