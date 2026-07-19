import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

/**
 * Discord's bot API does not support editing a bot account's bio/About Me
 * through the bot token. The `bio` field in `ClientUser#edit()` is only
 * available to self-bot (user-token) sessions, which violates Discord ToS.
 *
 * To change the bot's About Me:
 *   1. Go to https://discord.com/developers/applications
 *   2. Select your application → Bot tab
 *   3. There is currently no field for "About Me" on the bot profile — this
 *      is set on the underlying User account and is not programmable via bot tokens.
 *
 * This command exists as an owner utility but informs the operator of the limitation
 * rather than silently failing or making an unsupported API call.
 */
export default {
  data: new SlashCommandBuilder()
    .setName('setbio')
    .setDescription("Attempt to update the bot's About Me/bio (see notes on Discord API limitations)")
    .addStringOption(option =>
      option.setName('bio')
        .setDescription('New bio text (max 190 characters)')
        .setRequired(true)
        .setMaxLength(190)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const bio = interaction.options.getString('bio', true);

    await interaction.deferReply({ ephemeral: true });

    try {
      // Attempt the API call — succeeds only if the token has user-level edit rights,
      // which is not the case for standard bot tokens.
      await (interaction.client.user as any).edit({ bio });

      const embed = new EmbedBuilder()
        .setTitle('✅ Bio Updated')
        .setColor('#00ff00')
        .setDescription(`Bot bio set to:\n> ${bio}`)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Bio Update Not Supported')
        .setColor('#ff9900')
        .setDescription(
          'Discord does not allow bot tokens to edit the **About Me / bio** field programmatically.\n\n' +
          '**To change the bot bio:**\n' +
          '1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)\n' +
          '2. Select your application\n' +
          '3. Edit the **Description** field in the **General Information** tab\n\n' +
          `*API error: ${(error.message ?? 'Unknown').slice(0, 200)}*`,
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  },
};
