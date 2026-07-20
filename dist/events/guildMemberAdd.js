import { GuildModel } from "../database/models/Guild.js";
import { GlobalBanModel, BlacklistModel } from "../database/models/Moderation.js";
import { createWelcomeEmbed } from "../utils/welcomeEmbed.js";
import { scopedLogger } from "../utils/logger.js";
const log = scopedLogger("member-add");
function fillTemplate(template, member) {
    return template
        .replace(/{mention}/g, `${member}`)
        .replace(/{user}/g, member.user.tag)
        .replace(/{username}/g, member.user.username)
        .replace(/{server}/g, member.guild.name)
        .replace(/{memberCount}/g, String(member.guild.memberCount));
}
const event = {
    name: "guildMemberAdd",
    async execute(client, member) {
        try {
            if (await GlobalBanModel.exists({ userId: member.id })) {
                await member.ban({ reason: "Globally banned user (Panindigan network ban)" }).catch(() => { });
                return;
            }
            if (await BlacklistModel.exists({ entityId: member.id, entityType: "user" })) {
                await member.kick("Blacklisted user").catch(() => { });
                return;
            }
            const config = await GuildModel.findOne({ guildId: member.guild.id }).lean();
            if (!config)
                return;
            // Join gate — minimum account age check (anti-alt)
            const joinGate = config.joinGate;
            if (joinGate?.enabled && !member.user.bot) {
                const createdAt = Number(BigInt(member.id) >> 22n) + 1420070400000;
                const ageDays = Math.floor((Date.now() - createdAt) / 86_400_000);
                if (ageDays < joinGate.minAccountAgeDays) {
                    const kickMsg = joinGate.kickMessage ?? `Your account is too new to join **${member.guild.name}**. Please wait until your account is at least ${joinGate.minAccountAgeDays} days old.`;
                    await member.user.send(kickMsg).catch(() => { });
                    await member.kick(`[JoinGate] Account age ${ageDays}d < ${joinGate.minAccountAgeDays}d minimum`).catch(() => { });
                    log.info(`JoinGate kicked ${member.user.tag} (${ageDays}d old, min ${joinGate.minAccountAgeDays}d)`);
                    return;
                }
            }
            if (config.autoRoleIds?.length && !member.user.bot) {
                for (const roleId of config.autoRoleIds)
                    await member.roles.add(roleId).catch(() => { });
            }
            if (config.autoRoleBotId && member.user.bot) {
                await member.roles.add(config.autoRoleBotId).catch(() => { });
            }
            if (config.autoNicknameFormat) {
                await member.setNickname(fillTemplate(config.autoNicknameFormat, member)).catch(() => { });
            }
            // Welcome system
            const welcomeConfig = config.welcome;
            if (welcomeConfig?.enabled && welcomeConfig.channelId) {
                const channel = member.guild.channels.cache.get(welcomeConfig.channelId);
                if (channel?.isTextBased()) {
                    try {
                        const { embed, attachment } = await createWelcomeEmbed({
                            user: member.user,
                            member,
                            guild: member.guild,
                            channel: channel,
                            config: welcomeConfig,
                        });
                        if (welcomeConfig.dmEnabled) {
                            await member.user.send({ embeds: [embed], files: attachment ? [attachment] : [] }).catch(() => { });
                        }
                        if (welcomeConfig.embed) {
                            await channel.send({ embeds: [embed], files: attachment ? [attachment] : [] }).catch(() => { });
                        }
                        else {
                            await channel.send({ content: fillTemplate(welcomeConfig.message, member) }).catch(() => { });
                        }
                        // Assign autorole if configured
                        if (welcomeConfig.autoroleId) {
                            await member.roles.add(welcomeConfig.autoroleId).catch(() => { });
                        }
                        log.info(`Welcome message sent for ${member.user.tag} in ${member.guild.name}`);
                    }
                    catch (error) {
                        log.error("Failed to send welcome message", { error: String(error) });
                    }
                }
            }
        }
        catch (err) {
            log.error("guildMemberAdd handler failed", { error: err.message });
        }
    },
};
export default event;
//# sourceMappingURL=guildMemberAdd.js.map