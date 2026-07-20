import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ErrorLogModel } from '../../database/models/System.js';
export default {
    data: new SlashCommandBuilder()
        .setName('errorlog')
        .setDescription('Manage runtime error logs')
        .addSubcommand(sub => sub.setName('list')
        .setDescription('List all reported runtime errors')
        .addIntegerOption(o => o.setName('page').setDescription('Page number (default: 1)').setRequired(false).setMinValue(1)))
        .addSubcommand(sub => sub.setName('view')
        .setDescription('View details of a specific error entry')
        .addStringOption(o => o.setName('id').setDescription('Error entry MongoDB ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('clear')
        .setDescription('Clear all logged errors')),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });
        if (sub === 'list') {
            const page = (interaction.options.getInteger('page') ?? 1) - 1;
            const perPage = 10;
            const total = await ErrorLogModel.countDocuments();
            const entries = await ErrorLogModel.find({})
                .sort({ createdAt: -1 })
                .skip(page * perPage)
                .limit(perPage)
                .lean();
            const totalPages = Math.max(1, Math.ceil(total / perPage));
            const embed = new EmbedBuilder()
                .setTitle('🔴 Error Log')
                .setColor('#ff0000')
                .setDescription(entries.length > 0
                ? entries.map((e, i) => `\`${page * perPage + i + 1}.\` **[\`${e._id}\`]**\n  ${String(e.message ?? 'Unknown error').slice(0, 100)}\n  *<t:${Math.floor(new Date(e.createdAt).getTime() / 1000)}:R>*`).join('\n\n')
                : '*No errors logged. 🎉*')
                .setFooter({ text: `Page ${page + 1}/${totalPages} • Total: ${total}` })
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }
        if (sub === 'view') {
            const id = interaction.options.getString('id', true);
            const entry = await ErrorLogModel.findById(id).lean();
            if (!entry)
                return interaction.editReply({ content: `❌ Error entry \`${id}\` not found.` });
            const embed = new EmbedBuilder()
                .setTitle(`🔴 Error Entry`)
                .setColor('#ff0000')
                .addFields({ name: 'ID', value: `\`${entry._id}\``, inline: true }, { name: 'Logged', value: `<t:${Math.floor(new Date(entry.createdAt).getTime() / 1000)}:F>`, inline: true }, { name: 'Error Message', value: `\`\`\`\n${String(entry.message ?? '').slice(0, 1000)}\n\`\`\``, inline: false });
            if (entry.stack) {
                embed.addFields({ name: 'Stack Trace', value: `\`\`\`\n${String(entry.stack).slice(0, 1000)}\n\`\`\``, inline: false });
            }
            if (entry.context) {
                embed.addFields({ name: 'Context', value: `\`\`\`json\n${JSON.stringify(entry.context, null, 2).slice(0, 500)}\n\`\`\``, inline: false });
            }
            return interaction.editReply({ embeds: [embed] });
        }
        if (sub === 'clear') {
            const result = await ErrorLogModel.deleteMany({});
            return interaction.editReply({ content: `✅ Cleared **${result.deletedCount}** error log entries.` });
        }
    },
};
//# sourceMappingURL=errorlog.js.map