import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { EmbedFactory } from "../../structures/EmbedFactory.js";
import { createModCase } from "../../features/moderation/caseEngine.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";

const command: CommandDefinition = {
  name: "kick",
  description: "Kick a member from the server",
  category: "Moderation",
  access: "moderator",
  memberPermissions: [PermissionFlagsBits.KickMembers],
  botPermissions: [PermissionFlagsBits.KickMembers],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption((o) => o.setName("user").setDescription("Member to kick").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const targetId = ctx.isSlash ? ctx.interaction!.options.getUser("user", true).id : ctx.args[0]?.replace(/\D/g, "");
    const reason = ctx.isSlash ? ctx.interaction!.options.getString("reason") ?? "No reason provided" : ctx.args.slice(1).join(" ") || "No reason provided";

    if (!targetId) { await ctx.reply({ embeds: [EmbedFactory.error("Provide a member.")] }); return; }
    const member = await guild.members.fetch(targetId).catch(() => null);
    if (!member) { await ctx.reply({ embeds: [EmbedFactory.error("Member not found.")] }); return; }
    if (!member.kickable) { await ctx.reply({ embeds: [EmbedFactory.error("I cannot kick this member.")] }); return; }

    await member.send({ embeds: [EmbedFactory.warning(`You were kicked from **${guild.name}**. Reason: ${reason}`)] }).catch(() => {});
    await member.kick(reason);
    await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.userId, type: "kick", reason });
    await sendLogEvent(guild.id, "kick", () =>
      EmbedFactory.moderation(
        `**User:** <@${targetId}>\n**Moderator:** <@${ctx.userId}>\n**Reason:** ${reason}`,
        "👢 Member Kicked",
      ),
    );
    await ctx.reply({ embeds: [EmbedFactory.success(`<@${targetId}> has been kicked. Reason: ${reason}`)] });
  },
};
export default command;
