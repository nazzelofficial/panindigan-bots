import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "pet_adopt",
  description: "Adopt a pet",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("pet")
        .setDescription("Pet type")
        .setRequired(true)
        .addChoices(
          { name: "🐕 Dog", value: "dog" },
          { name: "🐈 Cat", value: "cat" },
          { name: "🐰 Rabbit", value: "rabbit" },
          { name: "🦊 Fox", value: "fox" },
          { name: "🐺 Wolf", value: "wolf" }
        )
    ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const pet = ctx.isSlash ? ctx.interaction!.options.getString("pet", true) : ctx.args[0]?.toLowerCase();
    if (!pet) return;

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

    if ((profile as any).pet) {
      return ctx.reply({ embeds: [errorEmbed("❌ You already have a pet")] });
    }

    const cost = 5000;
    if ((profile as any).balance < cost) {
      return ctx.reply({ embeds: [errorEmbed(`❌ You need ${cost} coins to adopt a pet`)] });
    }

    (profile as any).balance = ((profile as any).balance ?? 0) - cost;
    (profile as any).pet = pet;
    (profile as any).petHappiness = 100;
    (profile as any).petHunger = 0;
    await user.save();

    await ctx.reply({ embeds: [successEmbed(`✅ You adopted a ${pet}!`)] });
  },
};
export default command;
