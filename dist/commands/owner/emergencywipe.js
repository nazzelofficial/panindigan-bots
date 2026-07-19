import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry';
const VALID_TYPES = ['messages', 'roles', 'channels'];
export default {
    data: new SlashCommandBuilder()
        .setName('emergencywipe')
        .setDescription('Force delete data in a server — EMERGENCY USE ONLY (owner only — EXTREME RISK)')
        .addStringOption(option => option.setName('server_id')
        .setDescription('Target server ID')
        .setRequired(true))
        .addStringOption(option => option.setName('type')
        .setDescription('What to wipe')
        .setRequired(true)
        .addChoices({ name: 'Messages (purge all text channels)', value: 'messages' }, { name: 'Roles (delete all non-default roles)', value: 'roles' }, { name: 'Channels (delete all channels)', value: 'channels' }))
        .addStringOption(option => option.setName('confirm')
        .setDescription('Type "CONFIRM" to execute (irreversible)')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const serverId = interaction.options.getString('server_id', true);
        const type = interaction.options.getString('type', true);
        const confirm = interaction.options.getString('confirm', true);
        if (confirm !== 'CONFIRM') {
            return interaction.reply({ content: '❌ Confirmation failed. Type exactly `CONFIRM` to proceed.', ephemeral: true });
        }
        const client = clientRegistry.get();
        const guild = client.guilds.cache.get(serverId);
        if (!guild) {
            return interaction.reply({ content: '❌ Server not found in bot cache.', ephemeral: true });
        }
        await interaction.reply({
            content: `⚠️ **EMERGENCY WIPE** — Wiping **${type}** from **${guild.name}**. This is irreversible.`,
            ephemeral: true,
        });
        let deleted = 0;
        let failed = 0;
        try {
            if (type === 'messages') {
                for (const [, channel] of guild.channels.cache) {
                    if (!channel.isTextBased())
                        continue;
                    try {
                        const messages = await channel.messages.fetch({ limit: 100 });
                        if (messages.size > 0) {
                            await channel.bulkDelete(messages, true);
                            deleted += messages.size;
                        }
                    }
                    catch {
                        failed++;
                    }
                }
            }
            else if (type === 'roles') {
                const roles = guild.roles.cache.filter(r => !r.managed && r.id !== guild.roles.everyone.id);
                for (const [, role] of roles) {
                    try {
                        await role.delete(`Emergency wipe by ${interaction.user.tag}`);
                        deleted++;
                    }
                    catch {
                        failed++;
                    }
                }
            }
            else if (type === 'channels') {
                for (const [, channel] of guild.channels.cache) {
                    try {
                        await channel.delete(`Emergency wipe by ${interaction.user.tag}`);
                        deleted++;
                    }
                    catch {
                        failed++;
                    }
                }
            }
        }
        catch (error) {
            await interaction.followUp({ content: `❌ Wipe error: ${error.message}`, ephemeral: true });
            return;
        }
        const embed = new EmbedBuilder()
            .setTitle('🚨 Emergency Wipe Complete')
            .setColor('#ff0000')
            .addFields({ name: 'Server', value: `${guild.name} (\`${guild.id}\`)`, inline: true }, { name: 'Type', value: type, inline: true }, { name: 'Deleted', value: deleted.toString(), inline: true }, { name: 'Failed', value: failed.toString(), inline: true })
            .setTimestamp()
            .setFooter({ text: `Executed by ${interaction.user.tag}` });
        await interaction.followUp({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=emergencywipe.js.map