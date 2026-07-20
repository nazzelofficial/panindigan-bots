import { Events, MessageReaction, PartialMessageReaction, User, PartialUser } from "discord.js";
import type { EventDefinition } from "../structures/types.js";
import { ReactionRoleModel } from "../database/models/Community.js";
import { scopedLogger } from "../utils/logger.js";

const log = scopedLogger("reaction-remove");

const event: EventDefinition = {
  name: Events.MessageReactionRemove,
  async execute(_client, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    if (user.bot) return;
    if (!reaction.message.guildId) return;

    if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
    if (reaction.message.partial) { try { await reaction.message.fetch(); } catch { return; } }

    const guild = reaction.message.guild;
    if (!guild) return;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : (reaction.emoji.name ?? "");
    const messageId = reaction.message.id;

    const rr = await ReactionRoleModel.findOne({ guildId: guild.id, messageId, emoji });
    if (!rr) return;

    const role = guild.roles.cache.get(rr.roleId);
    if (!role) return;

    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role, "Reaction role removed").catch((err: any) => {
        log.warn(`Failed to remove reaction role ${role.id} from ${user.id}: ${err.message}`);
      });
    }
  },
};

export default event;
