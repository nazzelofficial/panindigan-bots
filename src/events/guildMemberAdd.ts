import type { GuildMember } from "discord.js";
import type { EventDefinition } from "../structures/types.js";
import { GuildModel } from "../database/models/Guild.js";
import { GlobalBanModel, BlacklistModel } from "../database/models/Moderation.js";
import { baseEmbed } from "../utils/embeds.js";
import { scopedLogger } from "../utils/logger.js";

const log = scopedLogger("member-add");

function fillTemplate(template: string, member: GuildMember): string {
  return template
    .replace(/{mention}/g, `${member}`)
    .replace(/{user}/g, member.user.tag)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, member.guild.name)
    .replace(/{memberCount}/g, String(member.guild.memberCount));
}

const event: EventDefinition = {
  name: "guildMemberAdd",
  async execute(client, member: GuildMember) {
    try {
      if (await GlobalBanModel.exists({ userId: member.id })) {
        await member.ban({ reason: "Globally banned user (Panindigan network ban)" }).catch(() => {});
        return;
      }
      if (await BlacklistModel.exists({ entityId: member.id, entityType: "user" })) {
        await member.kick("Blacklisted user").catch(() => {});
        return;
      }

      const config = await GuildModel.findOne({ guildId: member.guild.id }).lean();
      if (!config) return;

      // Join gate — minimum account age check (anti-alt)
      const joinGate = (config as any).joinGate;
      if (joinGate?.enabled && !member.user.bot) {
        const createdAt = Number(BigInt(member.id) >> 22n) + 1420070400000;
        const ageDays = Math.floor((Date.now() - createdAt) / 86_400_000);
        if (ageDays < joinGate.minAccountAgeDays) {
          const kickMsg = joinGate.kickMessage ?? `Your account is too new to join **${member.guild.name}**. Please wait until your account is at least ${joinGate.minAccountAgeDays} days old.`;
          await member.user.send(kickMsg).catch(() => {});
          await member.kick(`[JoinGate] Account age ${ageDays}d < ${joinGate.minAccountAgeDays}d minimum`).catch(() => {});
          log.info(`JoinGate kicked ${member.user.tag} (${ageDays}d old, min ${joinGate.minAccountAgeDays}d)`);
          return;
        }
      }

      if (config.autoRoleIds?.length && !member.user.bot) {
        for (const roleId of config.autoRoleIds) await member.roles.add(roleId).catch(() => {});
      }
      if (config.autoRoleBotId && member.user.bot) {
        await member.roles.add(config.autoRoleBotId).catch(() => {});
      }
      if (config.autoNicknameFormat) {
        await member.setNickname(fillTemplate(config.autoNicknameFormat, member)).catch(() => {});
      }

      if (config.welcome?.enabled && config.welcome.channelId) {
        const channel = member.guild.channels.cache.get(config.welcome.channelId);
        if (channel?.isTextBased()) {
          const text = fillTemplate(config.welcome.message, member);
          if (config.welcome.embed) {
            await channel.send({ embeds: [baseEmbed("success").setDescription(text).setThumbnail(member.user.displayAvatarURL())] }).catch(() => {});
          } else {
            await channel.send({ content: text }).catch(() => {});
          }
        }
      }
    } catch (err: any) {
      log.error("guildMemberAdd handler failed", { error: err.message });
    }
  },
};

export default event;
