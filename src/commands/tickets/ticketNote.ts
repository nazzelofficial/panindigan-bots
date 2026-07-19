import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
import { TicketModel } from "@/database/models/Tickets";

const command: CommandDefinition = {
  name: "ticketnote",
  description: "Add a staff note to the current ticket",
  category: "Tickets",
  access: "moderator",
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("note").setDescription("Note to add to this ticket").setRequired(true).setMaxLength(500),
    ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channel = ctx.interaction?.channel ?? ctx.message?.channel;
    if (!channel) return;
    const ticket = await TicketModel.findOne({ channelId: channel.id, status: { $ne: "archived" } });
    if (!ticket) { await ctx.reply({ embeds: [errorEmbed("This channel is not an active ticket.")] }); return; }
    const note = ctx.isSlash ? ctx.interaction!.options.getString("note", true) : ctx.args.join(" ");
    if (!note) { await ctx.reply({ embeds: [errorEmbed("Please provide a note.")] }); return; }
    const user = ctx.isSlash ? ctx.interaction!.user : ctx.message!.author;
    const embed = baseEmbed("warning")
      .setTitle("📝 Staff Note")
      .setDescription(note)
      .setFooter({ text: `Note added by ${user.tag}`, iconURL: user.displayAvatarURL() })
      .setTimestamp();
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
