import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "business_create",
  description: "Create a business",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Business name").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const name = ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[0];
    if (!name) return;

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

    if ((profile as any).business) {
      return ctx.reply({ embeds: [errorEmbed("❌ You already have a business")] });
    }

    const cost = 50000;
    if ((profile as any).balance < cost) {
      return ctx.reply({ embeds: [errorEmbed(`❌ You need ${cost} coins to create a business`)] });
    }

    (profile as any).balance = ((profile as any).balance ?? 0) - cost;
    (profile as any).business = name;
    (profile as any).businessLevel = 1;
    (profile as any).businessRevenue = 0;
    await user.save();

    await ctx.reply({ embeds: [successEmbed(`✅ Created business: ${name}`)] });
  },
};
export default command;
