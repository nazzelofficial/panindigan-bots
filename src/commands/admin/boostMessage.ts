import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "boost_message",
  description: "Set boost message",
  category: "Admin",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("message").setDescription("Boost message (use {user} for mention)").setRequired(true)),
  async execute(ctx) {
    const message = ctx.isSlash ? ctx.interaction!.options.getString("message", true) : ctx.args.join(" ");

    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { boostMessage: { ...((await GuildModel.findOne({ guildId: guild.id }))?.boostMessage || {}), message } },
      { upsert: true }
    );

    await ctx.reply({ embeds: [successEmbed("Boost message set")] });
  },
};
export default command;
