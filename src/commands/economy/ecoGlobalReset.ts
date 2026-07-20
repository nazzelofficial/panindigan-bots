import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "eco_global_reset",
  description: "Reset economy for all users (admin only)",
  category: "Economy",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("confirm").setDescription("Confirm this action").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const confirm = ctx.isSlash ? ctx.interaction!.options.getBoolean("confirm", true) : ctx.args[0]?.toLowerCase() === "true";

    if (!confirm) {
      return ctx.reply({ embeds: [errorEmbed("❌ Action cancelled")] });
    }

    const users = await UserModel.find();
    for (const user of users) {
      const profile = user.guilds.find((g: any) => g.guildId === guild.id);
      if (profile) {
        (profile as any).balance = 0;
        (profile as any).bank = 0;
        (profile as any).inventory = [];
        await user.save();
      }
    }

    await ctx.reply({ embeds: [successEmbed("✅ Economy reset for all users in this guild")] });
  },
};
export default command;
