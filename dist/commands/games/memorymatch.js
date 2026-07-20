import { infoEmbed } from '../../utils/embeds.js';
const command = {
    name: 'memorymatch',
    description: 'Play Memory Match game',
    category: 'Games',
    access: 'general',
    guildOnly: false,
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed('🧠 Memory Match game feature is coming soon!')] });
    },
};
export default command;
//# sourceMappingURL=memorymatch.js.map