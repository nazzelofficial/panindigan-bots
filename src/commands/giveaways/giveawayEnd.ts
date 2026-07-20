import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GiveawayModel } from "../../database/models/Community.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "giveawayend",
  description: "End a giveaway early and select winners now",
  category: "Giveaways",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["gend"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the giveaway").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const messageId = ctx.isSlash ? ctx.interaction!.options.getString("message_id", true) : ctx.args[0];
    if (!messageId) { await ctx.reply({ embeds: [errorEmbed("Please provide the giveaway message ID.")] }); return; }
    const giveaway = await GiveawayModel.findOne({ guildId: guild.id, messageId, ended: false }).lean();
    if (!giveaway) { await ctx.reply({ embeds: [errorEmbed("No active giveaway found with that message ID.")] }); return; }

    const participants: string[] = (giveaway as any).participants ?? [];
    const winnerCount = (giveaway as any).winnerCount ?? 1;
    const winners = shuffle(participants).slice(0, winnerCount);

    await GiveawayModel.findOneAndUpdate({ messageId }, { $set: { ended: true, endsAt: new Date(), winners } });

    const ch = guild.channels.cache.get((giveaway as any).channelId);
    if (ch?.isTextBased()) {
      const winnerMentions = winners.length ? winners.map((id) => `<@${id}>`).join(", ") : "No valid entries";
      await (ch as any).send({ content: `🎉 **Giveaway ended!** Congratulations ${winnerMentions}! You won **${(giveaway as any).prize}**!` }).catch(() => {});
    }

    await ctx.reply({ embeds: [successEmbed(`Giveaway ended! Winners: ${winners.length ? winners.map((id) => `<@${id}>`).join(", ") : "No entries"}`)], ...(ctx.isSlash ? { ephemeral: true } : {}) });
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default command;
