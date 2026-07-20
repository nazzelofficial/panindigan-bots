import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "economy_set",
  description: "Set a user balance",
  category: "Admin",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption((o) => o.setName("user").setDescription("User to set balance for").setRequired(true))
      .addIntegerOption((o) => o.setName("amount").setDescription("New balance").setRequired(true).setMinValue(0)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const user = ctx.isSlash ? ctx.interaction!.options.getUser("user", true) : ctx.message?.mentions.users.first();
    const amount = ctx.isSlash ? ctx.interaction!.options.getInteger("amount", true) : parseInt(ctx.args[1]);
    if (!user || amount === null) return;

    const dbUser = await UserModel.findOneAndUpdate(
      { userId: user.id },
      { $setOnInsert: { userId: user.id } },
      { upsert: true, new: true }
    );
    let profile = dbUser.guilds.find((g: any) => g.guildId === guild.id);
    if (!profile) {
      dbUser.guilds.push({ guildId: guild.id } as any);
      await dbUser.save();
      profile = dbUser.guilds[dbUser.guilds.length - 1];
    }

    (profile as any).balance = amount;
    await dbUser.save();

    await ctx.reply({ embeds: [successEmbed(`✅ Set ${user.tag}'s balance to 🪙 ${amount.toLocaleString()}`)] });
  },
};
export default command;
