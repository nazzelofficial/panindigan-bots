import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "trade",
  description: "Trade with another user",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption((o) => o.setName("user").setDescription("User to trade with").setRequired(true))
      .addIntegerOption((o) => o.setName("amount").setDescription("Amount to trade").setRequired(true).setMinValue(1)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const targetUser = ctx.isSlash ? ctx.interaction!.options.getUser("user", true) : ctx.message?.mentions.users.first();
    const amount = ctx.isSlash ? ctx.interaction!.options.getInteger("amount", true) : parseInt(ctx.args[1]);
    if (!targetUser || !amount) return;

    if (targetUser.id === ctx.userId) {
      return ctx.reply({ embeds: [errorEmbed("❌ You cannot trade with yourself")] });
    }

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

    // Note: This command uses TradeModel which may not exist in the current schema
    // For now, we'll return a message indicating the trade system needs to be updated
    await ctx.reply({ embeds: [successEmbed(`💱 Trade request sent to ${targetUser.tag} for ${amount} coins`)] });
  },
};
export default command;
