import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('uuid')
        .setDescription('Generate a random UUID'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const uuid = crypto.randomUUID();
        await interaction.reply({ content: `🔑 Generated UUID: \`${uuid}\``, ephemeral: true });
    },
};
//# sourceMappingURL=uuid.js.map