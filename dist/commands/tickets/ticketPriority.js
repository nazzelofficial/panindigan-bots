import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('ticket_priority')
        .setDescription('Set ticket priority')
        .addStringOption(option => option.setName('priority')
        .setDescription('Priority level')
        .setRequired(true)
        .addChoices({ name: 'Low', value: 'low' }, { name: 'Medium', value: 'medium' }, { name: 'High', value: 'high' }, { name: 'Urgent', value: 'urgent' })),
    category: 'Tickets',
    accessTier: 'user',
    async execute(interaction) {
        const priority = interaction.options.getString('priority', true);
        await interaction.reply({ content: `🎫 Ticket priority set to ${priority}`, ephemeral: true });
    },
};
//# sourceMappingURL=ticketPriority.js.map