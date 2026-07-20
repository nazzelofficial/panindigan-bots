import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "search",
  description: "Search for coins",
  category: "Economy",
  access: "general",
  guildOnly: true,
  cooldown: 60,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const locations = ["park", "street", "car", "couch", "pocket"];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const amount = Math.floor(Math.random() * 500) + 50;

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

    (profile as any).balance = ((profile as any).balance ?? 0) + amount;
    await user.save();

    await ctx.reply({ embeds: [successEmbed(`🔍 You searched the ${location} and found ${amount} coins!`)] });
  },
};
export default command;
