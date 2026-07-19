import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { TranslationModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('translation')
        .setDescription('Manage bot translation strings')
        .addSubcommand(sub => sub.setName('add')
        .setDescription('Add or update a translation string')
        .addStringOption(o => o.setName('lang').setDescription('Language code (e.g. tl, en, ja, ko)').setRequired(true))
        .addStringOption(o => o.setName('key').setDescription('Translation key (e.g. commands.ban.success)').setRequired(true))
        .addStringOption(o => o.setName('value').setDescription('Translated string').setRequired(true)))
        .addSubcommand(sub => sub.setName('missing')
        .setDescription('List keys missing from a language compared to English')
        .addStringOption(o => o.setName('lang').setDescription('Language code to check').setRequired(true)))
        .addSubcommand(sub => sub.setName('export')
        .setDescription('Export all translation strings for a language as JSON')
        .addStringOption(o => o.setName('lang').setDescription('Language code to export').setRequired(true))),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });
        if (sub === 'add') {
            const language = interaction.options.getString('lang', true).toLowerCase();
            const key = interaction.options.getString('key', true);
            const value = interaction.options.getString('value', true);
            await TranslationModel.findOneAndUpdate({ language, key }, { language, key, value }, { upsert: true, new: true });
            return interaction.editReply({
                content: `✅ Translation saved:\n**[${language}]** \`${key}\` → ${value}`,
            });
        }
        if (sub === 'missing') {
            const lang = interaction.options.getString('lang', true).toLowerCase();
            const enStrings = await TranslationModel.find({ language: 'en' }).lean();
            const langStrings = await TranslationModel.find({ language: lang }).lean();
            const langKeys = new Set(langStrings.map((s) => s.key));
            const missing = enStrings.filter((s) => !langKeys.has(s.key)).map((s) => s.key);
            const embed = new EmbedBuilder()
                .setTitle(`🌐 Missing Translations — [${lang}]`)
                .setColor('#ff9900')
                .setDescription(missing.length > 0
                ? missing.slice(0, 50).map(k => `• \`${k}\``).join('\n') + (missing.length > 50 ? `\n*...and ${missing.length - 50} more*` : '')
                : '✅ No missing translations! This language is fully translated.')
                .setFooter({ text: `${missing.length} missing out of ${enStrings.length} total EN keys` })
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }
        if (sub === 'export') {
            const lang = interaction.options.getString('lang', true).toLowerCase();
            const strings = await TranslationModel.find({ language: lang }).lean();
            if (strings.length === 0) {
                return interaction.editReply({ content: `❌ No translations found for language \`${lang}\`.` });
            }
            const obj = {};
            for (const s of strings)
                obj[s.key] = s.value;
            const buffer = Buffer.from(JSON.stringify(obj, null, 2), 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: `translations_${lang}.json` });
            return interaction.editReply({
                content: `✅ Exported **${strings.length}** strings for \`${lang}\`.`,
                files: [attachment],
            });
        }
    },
};
//# sourceMappingURL=translation.js.map