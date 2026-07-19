import { infoEmbed } from '@/utils/embeds';
const command = {
    name: 'bingo',
    description: 'Start a Bingo game',
    category: 'Games',
    access: 'general',
    guildOnly: true,
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed('🎱 Bingo game feature is coming soon!')] });
    },
};
export default command;
//# sourceMappingURL=bingo.js.map