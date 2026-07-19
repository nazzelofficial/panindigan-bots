import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { sendLogEvent } from '../../features/logging/logEngine';
import { baseEmbed } from '../../utils/embeds';
export default {
    data: new SlashCommandBuilder()
        .setName('voiceundeafen')
        .setDescription('Remove server-deafen from a user')
        .addUserOption(o => o.setName('user').setDescription('User to undeafen').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
    category: 'Moderation',
    accessTier: 'mod',
    memberPermissions: [PermissionFlagsBits.DeafenMembers],
    botPermissions: [PermissionFlagsBits.DeafenMembers],
    async execute(interaction) {
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const guild = interaction.guild;
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member)
            return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        if (!member.voice.serverDeaf)
            return interaction.reply({ content: '❌ That user is not server-deafened.', ephemeral: true });
        await member.voice.setDeaf(false, reason);
        await sendLogEvent(guild.id, 'voiceundeafen', () => baseEmbed('success')
            .setTitle('🔊 Voice Undeafen')
            .addFields({ name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true }, { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }, { name: 'Reason', value: reason, inline: false }));
        return interaction.reply({ content: `✅ **${user.tag}** has been un-deafened.`, ephemeral: true });
    },
};
//# sourceMappingURL=voiceundeafen.js.map