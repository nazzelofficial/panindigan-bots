import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "inventory_use",
  description: "Use an item from your inventory",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("item").setDescription("Item name").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const item = ctx.isSlash ? ctx.interaction!.options.getString("item", true) : ctx.args[0];
    if (!item) return;

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

    const inventory: any[] = (profile as any).inventory ?? [];
    const itemIndex = inventory.findIndex((i: any) => i.name === item || i.itemId === item);

    if (itemIndex === -1) {
      return ctx.reply({ embeds: [errorEmbed("❌ You do not own this item")] });
    }

    await ctx.reply({ embeds: [successEmbed(`✅ Used ${item}`)] });
  },
};
export default command;
