import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "buttonlist",
  description: "List all button role panels configured for this server",
  category: "Reaction Roles",
  access: "admin",
  guildOnly: true,
  cooldown: 5,
  slashData: (_b) => _b,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const buttons: any[] = ((cfg as any)?.reactionRoles ?? []).filter((r: any) => r.type === "button");
    if (!buttons.length) { await ctx.reply({ embeds: [infoEmbed("No button roles configured. Use `buttonadd` to add one.")] }); return; }
    const embed = baseEmbed("primary")
      .setTitle("🔘 Button Roles")
      .setDescription(buttons.map((r) => `**${r.label ?? "Button"}** → <@&${r.roleId}> in <#${r.channelId}> (msg: \`${r.messageId}\`)`).join("\n").slice(0, 2048))
      .setFooter({ text: `${buttons.length} button role${buttons.length !== 1 ? "s" : ""}` });
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
