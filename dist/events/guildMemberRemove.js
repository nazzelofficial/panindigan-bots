import { Events } from "discord.js";
import { sendLogEvent } from "../features/logging/logEngine.js";
import { baseEmbed } from "../utils/embeds.js";
import { GuildModel } from "../database/models/Guild.js";
const event = {
    name: Events.GuildMemberRemove,
    async execute(_client, member) {
        const cfg = await GuildModel.findOne({ guildId: member.guild.id }).lean();
        const goodbye = cfg?.goodbye;
        if (goodbye?.enabled && goodbye.channelId) {
            const ch = member.guild.channels.cache.get(goodbye.channelId);
            if (ch?.isTextBased()) {
                const msg = (goodbye.message ?? "Goodbye {user}! We hope to see you again.")
                    .replace("{user}", member.user?.username ?? "someone")
                    .replace("{mention}", `<@${member.id}>`)
                    .replace("{server}", member.guild.name)
                    .replace("{memberCount}", String(member.guild.memberCount));
                await ch.send({ content: msg }).catch(() => { });
            }
        }
        await sendLogEvent(member.guild.id, "memberLeave", () => baseEmbed("danger")
            .setTitle("👋 Member Left")
            .setThumbnail(member.user?.displayAvatarURL() ?? null)
            .addFields({ name: "User", value: `${member.user?.username ?? "Unknown"} (<@${member.id}>)`, inline: true }, { name: "ID", value: member.id, inline: true }, { name: "Joined", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Unknown", inline: true }, { name: "Member Count", value: String(member.guild.memberCount), inline: true })
            .setFooter({ text: `User ID: ${member.id}` })
            .setTimestamp());
    },
};
export default event;
//# sourceMappingURL=guildMemberRemove.js.map