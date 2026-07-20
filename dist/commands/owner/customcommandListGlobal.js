import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System.js';
export default {
    data: new SlashCommandBuilder()
        .setName('customcommand_list_global')
        .setDescription('List all global custom commands'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const system = await SystemModel.findOne({});
        const globalCustomCommands = system?.globalCustomCommands || {};
        const commands = Object.entries(globalCustomCommands);
        if (commands.length === 0) {
            return interaction.reply({ content: '❌ No global custom commands', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setTitle('📝 Global Custom Commands')
            .setColor('#00ff00')
            .setDescription(commands.map(([name, response]) => `**${name}**: ${response}`).join('\n'))
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=customcommandListGlobal.js.map