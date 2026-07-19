import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GiveawayModel } from "@/database/models/Community";
import { baseEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "giveawayentries",
  description: "View the current entry count (and list) for a giveaway",
  category: "Giveaways",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["gentries"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the giveaway").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const messageId = ctx.isSlash ? ctx.interaction!.options.getString("message_id", true) : ctx.args[0];
    if (!messageId) { await ctx.reply({ embeds: [errorEmbed("Please provide the giveaway message ID.")] }); return; }
    const giveaway = await GiveawayModel.findOne({ guildId: guild.id, messageId }).lean();
    if (!giveaway) { await ctx.reply({ embeds: [errorEmbed("No giveaway found with that message ID.")] }); return; }
    const participants: string[] = (giveaway as any).participants ?? [];
    const embed = baseEmbed("primary")
      .setTitle(`🎉 Entries — ${(giveaway as any).prize}`)
      .setDescription(participants.length ? participants.slice(0, 50).map((id) => `<@${id}>`).join(" ") + (participants.length > 50 ? ` …and ${participants.length - 50} more` : "") : "No entries yet.")
      .setFooter({ text: `${participants.length} total entr${participants.length !== 1 ? "ies" : "y"}` });
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
