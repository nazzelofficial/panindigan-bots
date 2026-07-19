import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('memory')
        .setDescription('View detailed bot memory usage'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const memoryUsage = process.memoryUsage();
        const embed = new EmbedBuilder()
            .setTitle('💾 Memory Usage')
            .setColor('#00ff00')
            .addFields({ name: 'Heap Used', value: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }, { name: 'Heap Total', value: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`, inline: true }, { name: 'External', value: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`, inline: true }, { name: 'RSS', value: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`, inline: true }, { name: 'Array Buffers', value: `${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`, inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=memory.js.map