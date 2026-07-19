import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { sendLogEvent } from '../../features/logging/logEngine';
import { baseEmbed } from '../../utils/embeds';
export default {
    data: new SlashCommandBuilder()
        .setName('voiceunmute')
        .setDescription('Remove server-mute from a user')
        .addUserOption(o => o.setName('user').setDescription('User to unmute').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
    category: 'Moderation',
    accessTier: 'mod',
    memberPermissions: [PermissionFlagsBits.MuteMembers],
    botPermissions: [PermissionFlagsBits.MuteMembers],
    async execute(interaction) {
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const guild = interaction.guild;
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member)
            return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        if (!member.voice.serverMute)
            return interaction.reply({ content: '❌ That user is not server-muted.', ephemeral: true });
        await member.voice.setMute(false, reason);
        await sendLogEvent(guild.id, 'voiceunmute', () => baseEmbed('success')
            .setTitle('🔊 Voice Unmute')
            .addFields({ name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true }, { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }, { name: 'Reason', value: reason, inline: false }));
        return interaction.reply({ content: `✅ **${user.tag}** has been un-muted.`, ephemeral: true });
    },
};
//# sourceMappingURL=voiceunmute.js.map