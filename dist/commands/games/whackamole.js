import { infoEmbed } from '../../utils/embeds';
const command = {
    name: 'whackamole',
    description: 'Play Whack-a-Mole',
    category: 'Games',
    access: 'general',
    guildOnly: false,
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed('🔨 Whack-a-Mole game feature is coming soon!')] });
    },
};
export default command;
//# sourceMappingURL=whackamole.js.map