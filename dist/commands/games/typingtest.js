import { EmbedBuilder } from 'discord.js';
const SENTENCES = [
    'The quick brown fox jumps over the lazy dog',
    'Pack my box with five dozen liquor jugs',
    'How vexingly quick daft zebras jump',
    'The five boxing wizards jump quickly',
    'Sphinx of black quartz judge my vow',
    'Two driven jocks help fax my big quiz',
    'Discord bots are built with JavaScript and TypeScript',
    'Panindigan is the best Filipino Discord bot ever made',
    'She sells seashells by the seashore',
    'Peter Piper picked a peck of pickled peppers',
    'The early bird catches the worm but the second mouse gets the cheese',
    'A stitch in time saves nine',
    'You can tune a piano but you cannot tuna fish',
];
function calculateWPM(text, elapsedMs) {
    const words = text.trim().split(/\s+/).length;
    const minutes = elapsedMs / 60_000;
    return Math.round(words / minutes);
}
function calculateAccuracy(original, typed) {
    const orig = original.toLowerCase().split('');
    const type = typed.toLowerCase().split('');
    let correct = 0;
    const len = Math.max(orig.length, type.length);
    for (let i = 0; i < Math.min(orig.length, type.length); i++) {
        if (orig[i] === type[i])
            correct++;
    }
    return Math.round((correct / len) * 100);
}
function gradeWPM(wpm) {
    if (wpm >= 80)
        return { grade: 'S — Pro Typist 🏆', color: 0xFFD700 };
    if (wpm >= 60)
        return { grade: 'A — Advanced ⚡', color: 0x00C851 };
    if (wpm >= 45)
        return { grade: 'B — Above Average 🟢', color: 0x22BB55 };
    if (wpm >= 30)
        return { grade: 'C — Average 🟡', color: 0xFFAA00 };
    if (wpm >= 20)
        return { grade: 'D — Needs Practice 🟠', color: 0xFF6600 };
    return { grade: 'F — Hunt & Pecker 🐢', color: 0xFF4444 };
}
const command = {
    name: 'typingtest',
    description: 'Test your typing speed! Type the displayed sentence as fast and accurately as you can.',
    category: 'Games',
    access: 'general',
    guildOnly: false,
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
        const promptEmbed = new EmbedBuilder()
            .setTitle('⌨️ Typing Test')
            .setColor(0x5865F2)
            .setDescription(`Type the following sentence in this channel as fast as you can!\n\n**\`\`\`\n${sentence}\n\`\`\`**`)
            .setFooter({ text: 'You have 60 seconds. Timer starts now!' })
            .setTimestamp();
        await ctx.reply({ embeds: [promptEmbed] });
        const startedAt = Date.now();
        const channel = ctx.message?.channel ?? ctx.interaction?.channel;
        if (!channel?.isTextBased())
            return;
        const filter = (m) => m.author.id === ctx.userId;
        const collector = channel.createMessageCollector({ filter, max: 1, time: 60_000 });
        collector.on('collect', async (msg) => {
            const elapsed = Date.now() - startedAt;
            const typed = msg.content;
            const wpm = calculateWPM(sentence, elapsed);
            const accuracy = calculateAccuracy(sentence, typed);
            const { grade, color } = gradeWPM(wpm);
            const exactMatch = typed.toLowerCase() === sentence.toLowerCase();
            const seconds = (elapsed / 1000).toFixed(2);
            const resultEmbed = new EmbedBuilder()
                .setTitle('⌨️ Typing Test — Results')
                .setColor(color)
                .addFields({ name: '⏱️ Time', value: `${seconds}s`, inline: true }, { name: '📝 WPM', value: `${wpm}`, inline: true }, { name: '🎯 Accuracy', value: `${accuracy}%`, inline: true }, { name: '🏅 Grade', value: grade, inline: false }, { name: '✅ Exact Match', value: exactMatch ? 'Yes! Perfect! 🎉' : 'No (some differences found)', inline: true })
                .setTimestamp();
            await msg.reply({ embeds: [resultEmbed] });
        });
        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                const ftCh = ctx.interaction?.channel ?? ctx.message?.channel;
                await ftCh?.send?.({
                    content: '⏰ Time\'s up! You didn\'t type the sentence in time.',
                }).catch(() => { });
            }
        });
    },
};
export default command;
//# sourceMappingURL=typingtest.js.map