import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "bank",
  description: "View your bank balance",
  category: "Economy",
  access: "general",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const doc = await UserModel.findOne({ userId: ctx.userId }).lean();
    const guildData = (doc as any)?.guilds?.find((g: any) => g.guildId === guild.id) ?? {};
    const wallet: number = guildData.balance ?? 0;
    const bank: number = guildData.bank ?? 0;

    const embed = baseEmbed("primary")
      .setTitle("🏦 Bank Balance")
      .addFields(
        { name: "Wallet", value: `🪙 **${wallet.toLocaleString()}**`, inline: true },
        { name: "Bank", value: `🪙 **${bank.toLocaleString()}**`, inline: true },
        { name: "Total", value: `🪙 **${(wallet + bank).toLocaleString()}**`, inline: true }
      );

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
