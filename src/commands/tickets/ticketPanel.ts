import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket_panel')
    .setDescription('Create a ticket panel')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Panel title')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Panel description')
        .setRequired(true)),
  category: 'Tickets',
  accessTier: 'admin',
  async execute(interaction: ChatInputCommandInteraction) {
    const title = interaction.options.getString('title', true);
    const description = interaction.options.getString('description', true);
    
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor('#00ff00')
      .setTimestamp();
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('Create Ticket')
          .setStyle(ButtonStyle.Primary)
      );
    
    await (interaction.channel as any)!.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Ticket panel created', ephemeral: true });
  },
} as unknown as CommandDefinition;
