import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "business_upgrade",
  description: "Upgrade your business",
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

    if (!(profile as any).business) {
      return ctx.reply({ embeds: [errorEmbed("❌ You do not have a business")] });
    }

    const currentLevel = (profile as any).businessLevel || 1;
    const cost = currentLevel * 10000;

    if ((profile as any).balance < cost) {
      return ctx.reply({ embeds: [errorEmbed(`❌ You need ${cost} coins to upgrade to level ${currentLevel + 1}`)] });
    }

    (profile as any).balance = ((profile as any).balance ?? 0) - cost;
    (profile as any).businessLevel = currentLevel + 1;
    await user.save();

    await ctx.reply({ embeds: [successEmbed(`✅ Business upgraded to level ${currentLevel + 1}!`)] });
  },
};
export default command;
