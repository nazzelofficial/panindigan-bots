import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import type { CommandDefinition } from '../../structures/types.js';
import { baseEmbed } from '../../utils/embeds.js';

interface Clue { clue: string; answer: string; hint: string }

const CLUES: Clue[] = [
  { clue: 'The capital of the Philippines', answer: 'MANILA', hint: 'M _ _ _ _ _' },
  { clue: 'The largest planet in our solar system', answer: 'JUPITER', hint: 'J _ _ _ _ _ _' },
  { clue: 'The chemical symbol for gold', answer: 'AU', hint: 'A _' },
  { clue: 'A programming language with a coffee logo', answer: 'JAVA', hint: 'J _ _ _' },
  { clue: 'The number of sides on a hexagon', answer: 'SIX', hint: 'S _ _' },
  { clue: 'The fastest land animal', answer: 'CHEETAH', hint: 'C _ _ _ _ _ _' },
  { clue: 'H2O is the formula for this', answer: 'WATER', hint: 'W _ _ _ _' },
  { clue: 'The color of the sky on a clear day', answer: 'BLUE', hint: 'B _ _ _' },
  { clue: 'A fruit that keeps the doctor away', answer: 'APPLE', hint: 'A _ _ _ _' },
  { clue: 'The continent where Egypt is located', answer: 'AFRICA', hint: 'A _ _ _ _ _' },
  { clue: 'Opposite of night', answer: 'DAY', hint: 'D _ _' },
  { clue: 'A shape with three sides', answer: 'TRIANGLE', hint: 'T _ _ _ _ _ _ _' },
  { clue: 'The process plants use to make food from sunlight', answer: 'PHOTOSYNTHESIS', hint: 'P _ _ _ _ _ _ _ _ _ _ _ _ _' },
  { clue: 'The closest star to Earth', answer: 'SUN', hint: 'S _ _' },
  { clue: 'The number of continents on Earth', answer: 'SEVEN', hint: 'S _ _ _ _' },
  { clue: 'Discord\'s programming language for its mobile app', answer: 'REACT', hint: 'R _ _ _ _' },
  { clue: 'A document that proves you own something', answer: 'TITLE', hint: 'T _ _ _ _' },
  { clue: 'The ocean between the Americas and Europe/Africa', answer: 'ATLANTIC', hint: 'A _ _ _ _ _ _ _' },
  { clue: 'Planet known as the Red Planet', answer: 'MARS', hint: 'M _ _ _' },
  { clue: 'The language most spoken in Brazil', answer: 'PORTUGUESE', hint: 'P _ _ _ _ _ _ _ _ _' },
];

const command: CommandDefinition = {
  name: 'crossword',
  description: 'Answer a random trivia clue — press the answer button you think is correct!',
  category: 'Games',
  access: 'general',
  guildOnly: false,
  cooldown: 10,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const { clue, answer, hint } = CLUES[Math.floor(Math.random() * CLUES.length)];

    // Generate 3 wrong answers (shuffled letters or random clues' answers)
    const wrongPool = CLUES.filter(c => c.answer !== answer).map(c => c.answer);
    const wrongs: string[] = [];
    const used = new Set<number>();
    while (wrongs.length < 3) {
      const idx = Math.floor(Math.random() * wrongPool.length);
      if (!used.has(idx)) { used.add(idx); wrongs.push(wrongPool[idx]); }
    }

    // Shuffle all 4 options
    const options = [answer, ...wrongs].sort(() => Math.random() - 0.5);
    const correctIdx = options.indexOf(answer);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      options.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`ans_${i}`)
          .setLabel(opt)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const embed = new EmbedBuilder()
      .setTitle('📝 Crossword Trivia')
      .setColor(0x5865F2)
      .addFields(
        { name: '📖 Clue', value: clue, inline: false },
        { name: '💡 Hint', value: `\`${hint}\``, inline: false },
      )
      .setDescription('Choose the correct answer! You have **20 seconds**.')
      .setFooter({ text: `Answer length: ${answer.length} letters` });

    const msg = await ctx.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = (msg as any).createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i: any) => i.user.id === ctx.userId,
      max: 1,
      time: 20_000,
    });

    collector.on('collect', async (btn: any) => {
      const chosen = parseInt(btn.customId.split('_')[1], 10);
      const isCorrect = chosen === correctIdx;

      const resultEmbed = new EmbedBuilder()
        .setTitle(isCorrect ? '✅ Correct!' : '❌ Wrong!')
        .setColor(isCorrect ? 0x00C851 : 0xFF4444)
        .addFields(
          { name: '📖 Clue', value: clue, inline: false },
          { name: '🎯 Correct Answer', value: `**${answer}**`, inline: true },
          { name: '🎮 Your Answer', value: `**${options[chosen]}**`, inline: true },
        )
        .setTimestamp();

      await btn.update({ embeds: [resultEmbed], components: [] });
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await (msg as any).edit({
          embeds: [
            new EmbedBuilder()
              .setTitle('⏰ Time\'s Up!')
              .setColor(0xFF4444)
              .addFields(
                { name: '📖 Clue', value: clue },
                { name: '✅ The answer was', value: `**${answer}**` },
              ),
          ],
          components: [],
        }).catch(() => {});
      }
    });
  },
};
export default command;
