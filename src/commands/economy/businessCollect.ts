import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "business_collect",
  description: "Collect business revenue",
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

    const revenue = ((profile as any).businessLevel || 1) * 1000;
    const pending = (profile as any).businessRevenue || 0;

    if (pending === 0) {
      return ctx.reply({ embeds: [errorEmbed("❌ No revenue to collect")] });
    }

    (profile as any).balance = ((profile as any).balance ?? 0) + pending;
    (profile as any).businessRevenue = 0;
    await user.save();

    await ctx.reply({ embeds: [successEmbed(`✅ Collected ${pending} coins from your business!`)] });
  },
};
export default command;
