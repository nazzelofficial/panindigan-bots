import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System.js';
export default {
    data: new SlashCommandBuilder()
        .setName('globalslowmode_set')
        .setDescription('Set forced minimum slowmode for all servers')
        .addIntegerOption(option => option.setName('seconds')
        .setDescription('Slowmode in seconds (0 to disable)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds', true);
        await SystemModel.findOneAndUpdate({}, { globalSlowmode: seconds }, { upsert: true });
        await interaction.reply({
            content: seconds === 0
                ? '✅ Disabled global slowmode'
                : `✅ Set global slowmode to ${seconds} seconds`,
            ephemeral: true
        });
    },
};
//# sourceMappingURL=globalslowmodeSet.js.map