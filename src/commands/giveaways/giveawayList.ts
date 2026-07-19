import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GiveawayModel } from "@/database/models/Community";
import { baseEmbed, infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "giveawaylist",
  description: "List all active giveaways in this server",
  category: "Giveaways",
  access: "general",
  guildOnly: true,
  cooldown: 10,
  aliases: ["glist"],
  slashData: (_b) => _b,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const giveaways = await GiveawayModel.find({ guildId: guild.id, ended: false }).sort({ endsAt: 1 }).limit(10).lean();
    if (!giveaways.length) { await ctx.reply({ embeds: [infoEmbed("No active giveaways. Use `giveawaystart` to create one.")] }); return; }
    const embed = baseEmbed("primary")
      .setTitle("🎉 Active Giveaways")
      .setDescription(giveaways.map((g: any) => `**${g.prize}**\nChannel: <#${g.channelId}> | Winners: ${g.winnerCount} | Ends: <t:${Math.floor(new Date(g.endsAt).getTime() / 1000)}:R>\n[Message](https://discord.com/channels/${guild.id}/${g.channelId}/${g.messageId})`).join("\n\n").slice(0, 2048))
      .setFooter({ text: `${giveaways.length} active giveaway${giveaways.length !== 1 ? "s" : ""}` });
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
