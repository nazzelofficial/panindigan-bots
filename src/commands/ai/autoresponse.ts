import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";

const command: CommandDefinition = {
  name: "autoresponse",
  description: "Set up AI auto-responses",
  category: "AI",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("trigger").setDescription("Trigger word/phrase").setRequired(true))
      .addStringOption((o) => o.setName("response").setDescription("AI response").setRequired(true)),
  async execute(ctx) {
    const trigger = ctx.isSlash ? ctx.interaction!.options.getString("trigger", true) : ctx.args[0];
    const response = ctx.isSlash ? ctx.interaction!.options.getString("response", true) : ctx.args[1];
    
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const config = await GuildModel.findOne({ guildId: guild.id });
    const autoResponses = (config as any)?.autoResponses || {};
    autoResponses[trigger] = response;
    
    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { autoResponses },
      { upsert: true }
    );
    
    await ctx.reply({ content: `✅ Auto-response set for "${trigger}"` });
  },
};
export default command;
