import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, } from 'discord.js';
function rateReaction(ms) {
    if (ms < 150)
        return { grade: 'S+', color: 0xFFD700, msg: 'Superhuman reflexes! 🏆' };
    if (ms < 200)
        return { grade: 'S', color: 0x00C851, msg: 'Incredible reaction! ⚡' };
    if (ms < 250)
        return { grade: 'A', color: 0x22BB55, msg: 'Very fast! 🟢' };
    if (ms < 300)
        return { grade: 'B', color: 0x55AAFF, msg: 'Above average!' };
    if (ms < 400)
        return { grade: 'C', color: 0xFFAA00, msg: 'Average reaction time.' };
    if (ms < 500)
        return { grade: 'D', color: 0xFF6600, msg: 'A bit slow...' };
    return { grade: 'F', color: 0xFF4444, msg: 'Very slow — or you fell asleep! 💤' };
}
const command = {
    name: 'reactiontest',
    description: 'Test your reaction time — click the button as fast as you can when it appears!',
    category: 'Games',
    access: 'general',
    guildOnly: false,
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        const waitMs = 2000 + Math.floor(Math.random() * 6000); // 2–8 seconds
        const waitEmbed = new EmbedBuilder()
            .setTitle('⚡ Reaction Test')
            .setColor(0xFF4444)
            .setDescription('**Get ready...**\nClick **🟢 CLICK!** as fast as you can when it appears!\n\n*Don\'t click early!*');
        const earlyBtn = new ButtonBuilder()
            .setCustomId('early')
            .setLabel('⏳ Wait...')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true);
        const msg = await ctx.reply({
            embeds: [waitEmbed],
            components: [new ActionRowBuilder().addComponents(earlyBtn)],
            fetchReply: true,
        });
        // Wait the random delay
        await new Promise(r => setTimeout(r, waitMs));
        // Show the active button
        const goBtn = new ButtonBuilder()
            .setCustomId('react')
            .setLabel('🟢 CLICK!')
            .setStyle(ButtonStyle.Success);
        const shownAt = Date.now();
        await msg.edit({
            embeds: [
                new EmbedBuilder()
                    .setTitle('⚡ Reaction Test')
                    .setColor(0x00C851)
                    .setDescription('**🟢 NOW! CLICK THE BUTTON!**'),
            ],
            components: [new ActionRowBuilder().addComponents(goBtn)],
        });
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.user.id === ctx.userId && i.customId === 'react',
            max: 1,
            time: 5000,
        });
        collector.on('collect', async (btn) => {
            const elapsed = Date.now() - shownAt;
            const { grade, color, msg: rateMsg } = rateReaction(elapsed);
            await btn.update({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('⚡ Reaction Test — Result')
                        .setColor(color)
                        .addFields({ name: '⏱️ Reaction Time', value: `**${elapsed}ms**`, inline: true }, { name: '🏅 Grade', value: `**${grade}**`, inline: true }, { name: '📝 Verdict', value: rateMsg, inline: false })
                        .setTimestamp(),
                ],
                components: [],
            });
        });
        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                await msg.edit({
                    embeds: [new EmbedBuilder().setTitle('⚡ Reaction Test').setColor(0xFF4444).setDescription('⏰ Time\'s up! You took too long (>5 seconds).')],
                    components: [],
                }).catch(() => { });
            }
        });
    },
};
export default command;
//# sourceMappingURL=reactiontest.js.map