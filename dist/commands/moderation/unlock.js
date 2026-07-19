import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel')
        .addChannelOption(option => option.setName('channel')
        .setDescription('Channel to unlock')
        .setRequired(false)),
    category: 'Moderation',
    accessTier: 'mod',
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        if (!channel || !('permissionOverwrites' in channel)) {
            return interaction.reply({ content: '❌ Invalid channel', ephemeral: true });
        }
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        await interaction.reply({ content: `✅ Unlocked ${channel}`, ephemeral: true });
    },
};
//# sourceMappingURL=unlock.js.map