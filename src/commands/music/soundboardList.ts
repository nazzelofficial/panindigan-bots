import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { GuildModel } from "../../database/models/Guild.js";

const command: CommandDefinition = {
  name: "soundboardlist",
  description: "List all sounds in the server soundboard",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["listsounds", "sounds"],
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
    const sounds: any[] = (doc as any)?.soundboard ?? [];
    if (sounds.length === 0) {
      await ctx.reply({ embeds: [errorEmbed("No sounds in the soundboard. Use `/soundboardadd` to add some.")] });
      return;
    }
    const lines = sounds.map((s, i) => `**${i + 1}.** \`${s.name}\``);
    const embed = baseEmbed("primary")
      .setTitle("🔊 Server Soundboard")
      .setDescription(lines.join("\n"))
      .setFooter({ text: `${sounds.length} sound${sounds.length !== 1 ? "s" : ""} • Use /soundboardplay <name> to play` });
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
