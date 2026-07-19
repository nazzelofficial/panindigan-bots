import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "created",
  description: "Show when a user account was created",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(false)),
  async execute(ctx) {
    const targetUser = ctx.isSlash ? ctx.interaction!.options.getUser("user") ?? ctx.interaction!.user : await ctx.client.users.fetch(ctx.userId);

    const embed = baseEmbed("primary")
      .setTitle("🎂 Account Creation Date")
      .setDescription(`<@${targetUser.id}> account created <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`)
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
