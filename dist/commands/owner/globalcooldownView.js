import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('globalcooldown_view')
        .setDescription('View global cooldown for a command')
        .addStringOption(option => option.setName('command')
        .setDescription('Command name')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const command = interaction.options.getString('command', true);
        const system = await SystemModel.findOne({});
        const globalCooldowns = system?.globalCooldowns || {};
        const cooldown = globalCooldowns[command] || 0;
        const embed = new EmbedBuilder()
            .setTitle(`⏱️ Global Cooldown: ${command}`)
            .setColor('#00ff00')
            .addFields({ name: 'Cooldown', value: `${cooldown} seconds`, inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=globalcooldownView.js.map