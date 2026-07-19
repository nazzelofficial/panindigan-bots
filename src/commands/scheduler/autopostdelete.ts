import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "autopostdelete",
  description: "Delete an auto-post",
  category: "Scheduler",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("id").setDescription("Auto-post ID to delete").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const id = ctx.isSlash ? ctx.interaction!.options.getString("id", true) : ctx.args[0];
    if (!id) {
      await ctx.reply({ embeds: [errorEmbed("Please provide an auto-post ID.")] });
      return;
    }

    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const autoPosts = (cfg as any)?.autoPosts ?? [];
    const index = autoPosts.findIndex((p: any) => p.id === id);

    if (index === -1) {
      await ctx.reply({ embeds: [errorEmbed("Auto-post not found.")] });
      return;
    }

    autoPosts.splice(index, 1);
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { autoPosts } });
    await ctx.reply({ embeds: [successEmbed("Auto-post deleted.")] });
  },
};
export default command;
