import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "nitrocheck",
  description: "Check if a user has Nitro",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(false)),
  async execute(ctx) {
    const targetUser = ctx.isSlash ? ctx.interaction!.options.getUser("user") ?? ctx.interaction!.user : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, "") ?? "");
    const isNitro = (targetUser as any).premiumType !== null;

    const embed = baseEmbed("primary")
      .setTitle("💎 Nitro Check")
      .setDescription(`<@${targetUser.id}> has ${isNitro ? "Nitro" : "no Nitro"}`)
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
