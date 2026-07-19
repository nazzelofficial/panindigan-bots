import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { sendLogEvent } from '../../features/logging/logEngine';
import { baseEmbed } from '../../utils/embeds';
export default {
    data: new SlashCommandBuilder()
        .setName('voicekick')
        .setDescription('Disconnect a user from their voice channel')
        .addUserOption(o => o.setName('user').setDescription('User to disconnect').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
    category: 'Moderation',
    accessTier: 'mod',
    memberPermissions: [PermissionFlagsBits.MoveMembers],
    botPermissions: [PermissionFlagsBits.MoveMembers],
    async execute(interaction) {
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const guild = interaction.guild;
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member)
            return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        if (!member.voice.channel)
            return interaction.reply({ content: '❌ That user is not in a voice channel.', ephemeral: true });
        const channelName = member.voice.channel.name;
        await member.voice.disconnect(reason);
        await sendLogEvent(guild.id, 'voicekick', () => baseEmbed('warning')
            .setTitle('🔇 Voice Kick')
            .addFields({ name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true }, { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }, { name: 'Channel', value: channelName, inline: true }, { name: 'Reason', value: reason, inline: false }));
        return interaction.reply({ content: `✅ **${user.tag}** has been disconnected from **${channelName}**. Reason: ${reason}`, ephemeral: true });
    },
};
//# sourceMappingURL=voicekick.js.map