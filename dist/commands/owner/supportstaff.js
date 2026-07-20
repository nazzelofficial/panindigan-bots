import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { SupportStaffModel } from '../../database/models/System.js';
import { clientRegistry } from '../../structures/clientRegistry.js';
export default {
    data: new SlashCommandBuilder()
        .setName('supportstaff')
        .setDescription('Manage bot support staff members')
        .addSubcommand(sub => sub.setName('add')
        .setDescription('Grant support staff access to a user')
        .addStringOption(o => o.setName('user_id').setDescription('User ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove')
        .setDescription('Revoke support staff access')
        .addStringOption(o => o.setName('user_id').setDescription('User ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('list')
        .setDescription('List all support staff members'))
        .addSubcommand(sub => sub.setName('activity')
        .setDescription('View support activity of a staff member')
        .addStringOption(o => o.setName('user_id').setDescription('User ID').setRequired(true))),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });
        if (sub === 'add') {
            const userId = interaction.options.getString('user_id', true);
            const existing = await SupportStaffModel.findOne({ userId });
            if (existing) {
                return interaction.editReply({ content: `❌ \`${userId}\` is already a support staff member.` });
            }
            await SupportStaffModel.create({ userId, addedBy: interaction.user.id });
            const client = clientRegistry.get();
            let tag = userId;
            try {
                tag = (await client.users.fetch(userId)).tag;
            }
            catch { /* ignore */ }
            return interaction.editReply({ content: `✅ **${tag}** added to support staff.` });
        }
        if (sub === 'remove') {
            const userId = interaction.options.getString('user_id', true);
            const result = await SupportStaffModel.findOneAndDelete({ userId });
            if (!result)
                return interaction.editReply({ content: `❌ \`${userId}\` is not a support staff member.` });
            return interaction.editReply({ content: `✅ \`${userId}\` removed from support staff.` });
        }
        if (sub === 'list') {
            const staff = await SupportStaffModel.find({}).lean();
            if (staff.length === 0)
                return interaction.editReply({ content: 'ℹ️ No support staff members configured.' });
            const client = clientRegistry.get();
            const lines = await Promise.all(staff.map(async (s) => {
                let tag = s.userId;
                try {
                    tag = (await client.users.fetch(s.userId)).tag;
                }
                catch { /* ignore */ }
                return `• **${tag}** (\`${s.userId}\`) — Added <t:${Math.floor(new Date(s.createdAt).getTime() / 1000)}:R> by <@${s.addedBy}>`;
            }));
            const embed = new EmbedBuilder()
                .setTitle('🤝 Support Staff Members')
                .setColor('#5865F2')
                .setDescription(lines.join('\n'))
                .setFooter({ text: `${staff.length} staff member(s)` })
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }
        if (sub === 'activity') {
            const userId = interaction.options.getString('user_id', true);
            const member = await SupportStaffModel.findOne({ userId }).lean();
            if (!member)
                return interaction.editReply({ content: `❌ \`${userId}\` is not a support staff member.` });
            const embed = new EmbedBuilder()
                .setTitle(`📋 Support Activity — \`${userId}\``)
                .setColor('#5865F2')
                .addFields({ name: 'Tickets Handled', value: (member.ticketsHandled ?? 0).toLocaleString(), inline: true }, { name: 'DMs Sent', value: (member.dmsSent ?? 0).toLocaleString(), inline: true }, { name: 'Added', value: `<t:${Math.floor(new Date(member.createdAt).getTime() / 1000)}:R>`, inline: true }, { name: 'Added By', value: `<@${member.addedBy}>`, inline: true })
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
//# sourceMappingURL=supportstaff.js.map