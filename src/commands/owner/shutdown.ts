import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { warnEmbed } from "@/utils/embeds";
import { scopedLogger } from "@/utils/logger";

const log = scopedLogger("owner:shutdown");

const command: CommandDefinition = {
  name: "shutdown",
  description: "Shut down the bot process",
  category: "Owner",
  access: "owner",
  guildOnly: false,
  cooldown: 30,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    await ctx.reply({ embeds: [warnEmbed("⚠️ Shutting down bot...")] });
    const user = ctx.isSlash ? ctx.interaction!.user.tag : ctx.message!.author.tag;
    log.info(`Bot shutdown triggered by ${user}`);
    setTimeout(() => process.exit(0), 1000);
  },
};
export default command;
