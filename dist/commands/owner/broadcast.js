import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry.js';
export default {
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('Broadcast a message to all servers')
        .addStringOption(option => option.setName('message')
        .setDescription('Message to broadcast')
        .setRequired(true))
        .addBooleanOption(option => option.setName('embed')
        .setDescription('Send as embed')
        .setRequired(false)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const message = interaction.options.getString('message', true);
        const asEmbed = interaction.options.getBoolean('embed') || false;
        const client = clientRegistry.get();
        await interaction.reply({ content: '📢 Broadcasting message...', ephemeral: true });
        let successCount = 0;
        let failCount = 0;
        for (const guild of client.guilds.cache.values()) {
            try {
                const channel = guild.systemChannel || guild.channels.cache.find((c) => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages'));
                if (channel && 'send' in channel) {
                    if (asEmbed) {
                        await channel.send({ embeds: [new EmbedBuilder().setDescription(message).setColor('#00ff00')] });
                    }
                    else {
                        await channel.send(message);
                    }
                    successCount++;
                }
                else {
                    failCount++;
                }
            }
            catch (error) {
                failCount++;
            }
        }
        await interaction.followUp({
            content: `✅ Broadcast complete: ${successCount} servers, ${failCount} failed`,
            ephemeral: true
        });
    },
};
//# sourceMappingURL=broadcast.js.map