import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "invest",
  description: "Invest coins",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) => o.setName("amount").setDescription("Amount to invest").setRequired(true).setMinValue(100))
      .addStringOption((o) =>
        o.setName("type").setDescription("Investment type").setRequired(true).addChoices(
          { name: "Low Risk (5% return)", value: "low" },
          { name: "Medium Risk (15% return)", value: "medium" },
          { name: "High Risk (40% return)", value: "high" }
        )
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const amount = ctx.isSlash ? ctx.interaction!.options.getInteger("amount", true) : parseInt(ctx.args[0]);
    const type = ctx.isSlash ? ctx.interaction!.options.getString("type", true) : ctx.args[1]?.toLowerCase();
    if (!amount || !type) return;

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

    if ((profile as any).balance < amount) {
      return ctx.reply({ embeds: [errorEmbed("❌ Insufficient balance")] });
    }

    const returns = { low: 0.05, medium: 0.15, high: 0.40 };
    const returnRate = returns[type as keyof typeof returns] || 0.05;
    const returnAmount = Math.floor(amount * returnRate);

    (profile as any).balance = ((profile as any).balance ?? 0) - amount;
    (profile as any).investmentAmount = amount;
    (profile as any).investmentReturn = returnAmount;
    (profile as any).investmentType = type;
    await user.save();

    await ctx.reply({ embeds: [successEmbed(`✅ Invested ${amount} coins in ${type} risk. Potential return: ${returnAmount} coins`)] });
  },
};
export default command;
