import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('utilityship')
        .setDescription('Ship two users together')
        .addUserOption(option => option.setName('user1')
        .setDescription('First user')
        .setRequired(true))
        .addUserOption(option => option.setName('user2')
        .setDescription('Second user')
        .setRequired(true)),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const user1 = interaction.options.getUser('user1', true);
        const user2 = interaction.options.getUser('user2', true);
        const percentage = Math.floor(Math.random() * 100) + 1;
        const embed = new EmbedBuilder()
            .setTitle('💕 Ship')
            .setColor('#ff69b4')
            .setDescription(`${user1.username} ❤️ ${user2.username}`)
            .addFields({ name: 'Compatibility', value: `${percentage}%`, inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=ship.js.map