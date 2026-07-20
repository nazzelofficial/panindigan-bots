import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "give",
  description: "Give coins to another user",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption((o) => o.setName("user").setDescription("User to give coins to").setRequired(true))
      .addIntegerOption((o) => o.setName("amount").setDescription("Amount to give").setRequired(true).setMinValue(1)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const targetUser = ctx.isSlash ? ctx.interaction!.options.getUser("user", true) : ctx.message?.mentions.users.first();
    const amount = ctx.isSlash ? ctx.interaction!.options.getInteger("amount", true) : parseInt(ctx.args[1]);
    if (!targetUser || !amount) return;

    if (targetUser.id === ctx.userId) {
      return ctx.reply({ embeds: [errorEmbed("❌ You cannot give coins to yourself")] });
    }

    const sender = await UserModel.findOneAndUpdate(
      { userId: ctx.userId },
      { $setOnInsert: { userId: ctx.userId } },
      { upsert: true, new: true }
    );
    let senderProfile = sender.guilds.find((g: any) => g.guildId === guild.id);
    if (!senderProfile) {
      sender.guilds.push({ guildId: guild.id } as any);
      await sender.save();
      senderProfile = sender.guilds[sender.guilds.length - 1];
    }

    if ((senderProfile as any).balance < amount) {
      return ctx.reply({ embeds: [errorEmbed("❌ Insufficient balance")] });
    }

    (senderProfile as any).balance = ((senderProfile as any).balance ?? 0) - amount;
    await sender.save();

    const receiver = await UserModel.findOneAndUpdate(
      { userId: targetUser.id },
      { $setOnInsert: { userId: targetUser.id } },
      { upsert: true, new: true }
    );
    let receiverProfile = receiver.guilds.find((g: any) => g.guildId === guild.id);
    if (!receiverProfile) {
      receiver.guilds.push({ guildId: guild.id } as any);
      await receiver.save();
      receiverProfile = receiver.guilds[receiver.guilds.length - 1];
    }

    (receiverProfile as any).balance = ((receiverProfile as any).balance ?? 0) + amount;
    await receiver.save();

    await ctx.reply({ embeds: [successEmbed(`✅ Gave ${amount} coins to ${targetUser.tag}`)] });
  },
};
export default command;
