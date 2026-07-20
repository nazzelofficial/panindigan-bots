import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "colorlist",
  description: "List all color roles in the color chooser",
  category: "Reaction Roles",
  access: "admin",
  guildOnly: true,
  cooldown: 5,
  slashData: (_b) => _b,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const ids: string[] = (cfg as any)?.colorRoles?.roleIds ?? [];
    if (!ids.length) { await ctx.reply({ embeds: [infoEmbed("No color roles configured. Use `coloradd` to add one.")] }); return; }
    const embed = baseEmbed("primary").setTitle("🎨 Color Roles").setDescription(ids.map((id) => `• <@&${id}>`).join("\n")).setFooter({ text: `${ids.length} color role${ids.length !== 1 ? "s" : ""}` });
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
