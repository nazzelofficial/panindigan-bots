import { Events } from "discord.js";
import { ReactionRoleModel } from "../database/models/Community";
import { scopedLogger } from "../utils/logger";
const log = scopedLogger("reaction-add");
const event = {
    name: Events.MessageReactionAdd,
    async execute(_client, reaction, user) {
        if (user.bot)
            return;
        if (!reaction.message.guildId)
            return;
        if (reaction.partial) {
            try {
                await reaction.fetch();
            }
            catch {
                return;
            }
        }
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            }
            catch {
                return;
            }
        }
        const guild = reaction.message.guild;
        if (!guild)
            return;
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member)
            return;
        const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : (reaction.emoji.name ?? "");
        const messageId = reaction.message.id;
        const rr = await ReactionRoleModel.findOne({ guildId: guild.id, messageId, emoji });
        if (!rr)
            return;
        const role = guild.roles.cache.get(rr.roleId);
        if (!role)
            return;
        if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role, "Reaction role").catch((err) => {
                log.warn(`Failed to add reaction role ${role.id} to ${user.id}: ${err.message}`);
            });
        }
    },
};
export default event;
//# sourceMappingURL=messageReactionAdd.js.map