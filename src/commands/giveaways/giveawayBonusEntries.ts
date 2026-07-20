import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GiveawayModel } from "../../database/models/Community.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "giveawaybonusentries",
  description: "Grant bonus giveaway entries to a user",
  category: "Giveaways",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["gbonusentries", "gbonus"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the giveaway").setRequired(true))
      .addUserOption((o) => o.setName("user").setDescription("User to give bonus entries").setRequired(true))
      .addIntegerOption((o) => o.setName("entries").setDescription("Number of extra entries (1–50)").setRequired(true).setMinValue(1).setMaxValue(50)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const messageId = ctx.isSlash ? ctx.interaction!.options.getString("message_id", true) : ctx.args[0];
    const userId = ctx.isSlash ? ctx.interaction!.options.getUser("user", true).id : ctx.args[1]?.replace(/\D/g, "");
    const entries = ctx.isSlash ? ctx.interaction!.options.getInteger("entries", true) : parseInt(ctx.args[2] ?? "1");
    if (!messageId || !userId) { await ctx.reply({ embeds: [errorEmbed("Please provide message ID and user.")] }); return; }
    const giveaway = await GiveawayModel.findOne({ guildId: guild.id, messageId, ended: false }).lean();
    if (!giveaway) { await ctx.reply({ embeds: [errorEmbed("No active giveaway found with that message ID.")] }); return; }
    // Add bonus entries as duplicate userId entries in participants
    const bonusArray = Array(entries).fill(userId);
    await GiveawayModel.findOneAndUpdate({ messageId }, { $push: { participants: { $each: bonusArray } } });
    await ctx.reply({ embeds: [successEmbed(`Granted <@${userId}> **${entries}** bonus entr${entries !== 1 ? "ies" : "y"} in the **${(giveaway as any).prize}** giveaway.`)] });
  },
};
export default command;
