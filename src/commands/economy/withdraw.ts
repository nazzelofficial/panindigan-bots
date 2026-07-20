import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "withdraw",
  description: "Withdraw coins from your bank",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("amount").setDescription("Amount to withdraw").setRequired(true).setMinValue(1)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const amount = ctx.isSlash ? ctx.interaction!.options.getInteger("amount", true) : parseInt(ctx.args[0]);
    if (!amount) return;

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

    if ((profile as any).bank < amount) {
      return ctx.reply({ embeds: [errorEmbed("❌ Insufficient bank balance")] });
    }

    (profile as any).balance = ((profile as any).balance ?? 0) + amount;
    (profile as any).bank = ((profile as any).bank ?? 0) - amount;
    await user.save();

    await ctx.reply({ embeds: [successEmbed(`✅ Withdrew ${amount} coins from bank`)] });
  },
};
export default command;
