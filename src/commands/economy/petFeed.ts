import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "pet_feed",
  description: "Feed your pet",
  category: "Economy",
  access: "general",
  guildOnly: true,
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

    if (!(profile as any).pet) {
      return ctx.reply({ embeds: [errorEmbed("❌ You do not have a pet")] });
    }

    const cost = 100;
    if ((profile as any).balance < cost) {
      return ctx.reply({ embeds: [errorEmbed(`❌ You need ${cost} coins to feed your pet`)] });
    }

    (profile as any).balance = ((profile as any).balance ?? 0) - cost;
    (profile as any).petHunger = Math.max(0, ((profile as any).petHunger ?? 0) - 20);
    (profile as any).petHappiness = Math.min(100, ((profile as any).petHappiness ?? 0) + 10);
    await user.save();

    await ctx.reply({ embeds: [successEmbed("✅ You fed your pet!")] });
  },
};
export default command;
