import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { GuildModel } from "../../database/models/Guild.js";

const command: CommandDefinition = {
  name: "soundboardremove",
  description: "Remove a sound from the server soundboard",
  category: "Music",
  access: "admin",
  guildOnly: true,
  cooldown: 5,
  aliases: ["removesound", "deletesound"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("name").setDescription("Name of the sound to remove").setRequired(true),
    ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const name = (ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[0] ?? "").toLowerCase();
    const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
    const sounds: any[] = (doc as any)?.soundboard ?? [];
    const exists = sounds.some((s) => s.name === name);
    if (!exists) { await ctx.reply({ embeds: [errorEmbed(`Sound **"${name}"** not found.`)] }); return; }
    await GuildModel.updateOne({ guildId: guild.id }, { $pull: { soundboard: { name } } });
    await ctx.reply({ embeds: [successEmbed(`🗑️ Removed sound **"${name}"** from the soundboard.`)] });
  },
};
export default command;
