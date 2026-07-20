import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "pet_play",
  description: "Play with your pet",
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

    (profile as any).petHappiness = Math.min(100, ((profile as any).petHappiness ?? 0) + 15);
    (profile as any).petHunger = Math.min(100, ((profile as any).petHunger ?? 0) + 5);
    await user.save();

    await ctx.reply({ embeds: [successEmbed("✅ You played with your pet!")] });
  },
};
export default command;
