import { infoEmbed } from '../../utils/embeds';
const command = {
    name: 'wordsearch',
    description: 'Play Word Search',
    category: 'Games',
    access: 'general',
    guildOnly: false,
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed('🔍 Word search puzzle feature is coming soon!')] });
    },
};
export default command;
//# sourceMappingURL=wordsearch.js.map