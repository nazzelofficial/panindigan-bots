import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { sendLogEvent } from '../../features/logging/logEngine.js';
import { baseEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('voicedeafen')
        .setDescription('Server-deafen a user in voice channels')
        .addUserOption(o => o.setName('user').setDescription('User to deafen').setRequired(true))
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
        if (member.voice.serverDeaf)
            return interaction.reply({ content: '❌ That user is already server-deafened.', ephemeral: true });
        await member.voice.setDeaf(true, reason);
        await sendLogEvent(guild.id, 'voicedeafen', () => baseEmbed('warning')
            .setTitle('🔇 Voice Deafen')
            .addFields({ name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true }, { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }, { name: 'Reason', value: reason, inline: false }));
        return interaction.reply({ content: `✅ **${user.tag}** has been server-deafened. Reason: ${reason}`, ephemeral: true });
    },
};
//# sourceMappingURL=voicedeafen.js.map