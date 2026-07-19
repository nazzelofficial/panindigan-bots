import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('pack_discount_set')
        .setDescription('Adjust the discount percentage of a Server Pack')
        .addStringOption(option => option.setName('pack')
        .setDescription('Server pack')
        .setRequired(true)
        .addChoices({ name: '3-Server Pack', value: '3-server' }, { name: '5-Server Pack', value: '5-server' }, { name: '10-Server Pack', value: '10-server' }))
        .addIntegerOption(option => option.setName('percent')
        .setDescription('Discount percentage (0-100)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const pack = interaction.options.getString('pack', true);
        const percent = interaction.options.getInteger('percent', true);
        const system = await SystemModel.findOne({});
        const discounts = system?.serverPackDiscounts || {
            '3-server': 0,
            '5-server': 0,
            '10-server': 0
        };
        discounts[pack] = percent;
        await SystemModel.findOneAndUpdate({}, { serverPackDiscounts: discounts }, { upsert: true });
        await interaction.reply({
            content: `✅ Set ${pack} discount to ${percent}%`,
            ephemeral: true
        });
    },
};
//# sourceMappingURL=packDiscountSet.js.map