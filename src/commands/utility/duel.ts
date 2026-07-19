import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "duel",
  description: "Challenge someone to a duel",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addUserOption((o) => o.setName("opponent").setDescription("User to duel").setRequired(true)),
  async execute(ctx) {
    const opponent = ctx.isSlash ? ctx.interaction!.options.getUser("opponent", true) : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, "") ?? "");
    const embed = baseEmbed("primary").setTitle("⚔️ Duel").setDescription(`Duel started between <@${ctx.userId}> and <@${opponent.id}>!`);
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
