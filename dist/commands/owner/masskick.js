import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry.js';
export default {
    data: new SlashCommandBuilder()
        .setName('masskick')
        .setDescription('Kick multiple users simultaneously in a specific server (owner only — HIGH RISK)')
        .addStringOption(option => option.setName('server_id')
        .setDescription('Target server ID')
        .setRequired(true))
        .addStringOption(option => option.setName('user_ids')
        .setDescription('Space or comma-separated user IDs to kick')
        .setRequired(true))
        .addStringOption(option => option.setName('reason')
        .setDescription('Reason for mass kick')
        .setRequired(false)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const serverId = interaction.options.getString('server_id', true);
        const rawIds = interaction.options.getString('user_ids', true);
        const reason = interaction.options.getString('reason') || 'Mass kick by bot owner';
        const client = clientRegistry.get();
        const guild = client.guilds.cache.get(serverId);
        if (!guild) {
            return interaction.reply({ content: '❌ Server not found in bot cache.', ephemeral: true });
        }
        const userIds = rawIds.split(/[\s,]+/).map(id => id.trim()).filter(Boolean);
        if (userIds.length === 0) {
            return interaction.reply({ content: '❌ No valid user IDs provided.', ephemeral: true });
        }
        if (userIds.length > 200) {
            return interaction.reply({ content: '❌ Cannot mass kick more than 200 users at once.', ephemeral: true });
        }
        await interaction.reply({ content: `⚠️ Mass kicking **${userIds.length}** users from **${guild.name}**...`, ephemeral: true });
        let success = 0;
        let failed = 0;
        const failedIds = [];
        for (const uid of userIds) {
            try {
                const member = guild.members.cache.get(uid) ?? await guild.members.fetch(uid).catch(() => null);
                if (!member) {
                    failed++;
                    failedIds.push(uid);
                    continue;
                }
                await member.kick(`[MASSKICK] ${reason} | By: ${interaction.user.tag}`);
                success++;
            }
            catch {
                failed++;
                failedIds.push(uid);
            }
        }
        const embed = new EmbedBuilder()
            .setTitle('👢 Mass Kick Complete')
            .setColor(failed > 0 ? '#ff9900' : '#00ff00')
            .addFields({ name: 'Server', value: `${guild.name} (\`${guild.id}\`)`, inline: true }, { name: 'Requested', value: userIds.length.toString(), inline: true }, { name: 'Kicked', value: success.toString(), inline: true }, { name: 'Failed', value: failed.toString(), inline: true }, { name: 'Reason', value: reason, inline: false });
        if (failedIds.length > 0) {
            embed.addFields({ name: 'Failed IDs', value: failedIds.slice(0, 20).join(', ').slice(0, 1024), inline: false });
        }
        embed.setTimestamp().setFooter({ text: `Executed by ${interaction.user.tag}` });
        await interaction.followUp({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=masskick.js.map