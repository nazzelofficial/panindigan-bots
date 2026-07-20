import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry.js';
export default {
    data: new SlashCommandBuilder()
        .setName('dm_embed')
        .setDescription('DM a rich embed to a user')
        .addStringOption(option => option.setName('user_id')
        .setDescription('User ID to DM')
        .setRequired(true))
        .addStringOption(option => option.setName('message')
        .setDescription('Embed message content')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const userId = interaction.options.getString('user_id', true);
        const message = interaction.options.getString('message', true);
        const client = clientRegistry.get();
        try {
            const user = await client.users.fetch(userId);
            const embed = new EmbedBuilder()
                .setDescription(message)
                .setColor('#00ff00')
                .setTimestamp();
            await user.send({ embeds: [embed] });
            await interaction.reply({ content: `✅ Embed DM sent to ${user.tag}`, ephemeral: true });
        }
        catch (error) {
            await interaction.reply({ content: `❌ Failed to send DM: ${error.message}`, ephemeral: true });
        }
    },
};
//# sourceMappingURL=dmEmbed.js.map