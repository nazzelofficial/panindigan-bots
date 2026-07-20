import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";

// ── Lexicons ────────────────────────────────────────────────────────────────

const POSITIVE_WORDS = new Set([
  'good','great','excellent','amazing','awesome','fantastic','wonderful','outstanding',
  'brilliant','superb','perfect','love','like','enjoy','happy','joy','excited','glad',
  'pleased','delighted','thankful','grateful','appreciate','impressive','magnificent',
  'beautiful','incredible','positive','nice','kind','friendly','helpful','fun','best',
  'success','successful','win','winning','achieve','accomplish','proud','enthusiastic',
  'optimistic','confident','hopeful','inspiring','motivated','passionate','creative',
  'clever','smart','talented','skilled','powerful','strong','fast','efficient',
]);

const NEGATIVE_WORDS = new Set([
  'bad','terrible','awful','horrible','dreadful','disgusting','hate','dislike','angry',
  'sad','upset','disappointed','frustrated','annoyed','irritated','furious','mad',
  'depressed','miserable','unhappy','worried','anxious','scared','afraid','nervous',
  'stressed','overwhelmed','exhausted','tired','bored','confused','lost','fail',
  'failure','mistake','error','wrong','broken','useless','worthless','stupid','ugly',
  'poor','weak','slow','difficult','problem','issue','trouble','disaster','crisis',
  'dangerous','harmful','toxic','negative','worst','never','impossible','cannot',
]);

// Intensifiers that boost the next word
const INTENSIFIERS = new Set(['very','really','extremely','absolutely','totally','quite','so']);

// Negators that flip sentiment
const NEGATORS = new Set(['not','no','never','neither','nor','without','barely','hardly','scarcely']);

interface SentimentResult {
  score: number;    // -1.0 to 1.0
  positive: number; // raw positive word count
  negative: number; // raw negative word count
  total: number;    // total meaningful words
  sentences: number;
}

function analyseSentiment(text: string): SentimentResult {
  const words = text.toLowerCase().replace(/[^a-z\s']/g, ' ').split(/\s+/).filter(Boolean);
  let positive = 0;
  let negative = 0;
  let meaningful = 0;
  const sentences = (text.match(/[.!?]+/g) ?? []).length || 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prev = i > 0 ? words[i - 1] : '';
    const negated = NEGATORS.has(prev) || (i > 1 && NEGATORS.has(words[i - 2]));
    const amplified = INTENSIFIERS.has(prev);
    const weight = amplified ? 1.5 : 1;

    if (POSITIVE_WORDS.has(word)) {
      meaningful++;
      if (negated) negative += weight;
      else positive += weight;
    } else if (NEGATIVE_WORDS.has(word)) {
      meaningful++;
      if (negated) positive += weight;
      else negative += weight;
    }
  }

  const total = Math.max(positive + negative, 1);
  const score = (positive - negative) / total;

  return { score, positive, negative, total, sentences };
}

function getTone(text: string): string {
  const lower = text.toLowerCase();
  if (/[!]{2,}|\bwow\b|\bomg\b|\bamazing\b/i.test(text)) return 'Excited / Enthusiastic';
  if (/[?]{1,}/.test(text) && !/[.!]/.test(text)) return 'Inquisitive / Questioning';
  if (/\b(sorry|apologize|forgive|excuse)\b/i.test(text)) return 'Apologetic';
  if (/\b(please|kindly|would you|could you)\b/i.test(text)) return 'Polite / Formal';
  if (/\b(must|need|should|have to|required)\b/i.test(text)) return 'Assertive / Directive';
  if (/\b(think|believe|consider|maybe|perhaps|possibly)\b/i.test(text)) return 'Contemplative / Uncertain';
  if (/\b(haha|lol|😂|🤣|funny|hilarious)\b/i.test(text)) return 'Humorous / Casual';
  return 'Neutral / Informational';
}

export default {
  name: "analyze",
  description: "Analyze the sentiment and tone of any text using rule-based NLP",
  category: "AI",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) =>
        o.setName("text").setDescription("Text to analyze (max 1000 chars)").setRequired(true).setMaxLength(1000)
      ),
  async execute(ctx) {
    const text = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.join(" ");

    if (!text.trim()) {
      await ctx.reply({ content: "❌ Please provide some text to analyze.", ephemeral: true });
      return;
    }

    const result = analyseSentiment(text);
    const tone = getTone(text);

    let sentiment: string;
    let sentimentEmoji: string;
    let color: number;
    const pct = Math.round(((result.score + 1) / 2) * 100);

    if (result.score > 0.3)       { sentiment = 'Positive';        sentimentEmoji = '😊'; color = 0x00C851; }
    else if (result.score > 0.05) { sentiment = 'Mostly Positive'; sentimentEmoji = '🙂'; color = 0x22BB55; }
    else if (result.score < -0.3) { sentiment = 'Negative';        sentimentEmoji = '😠'; color = 0xFF4444; }
    else if (result.score < -0.05){ sentiment = 'Mostly Negative'; sentimentEmoji = '😕'; color = 0xFF8800; }
    else                          { sentiment = 'Neutral';          sentimentEmoji = '😐'; color = 0x5865F2; }

    // Confidence = how many sentiment words were found vs total words
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const confidence = Math.min(100, Math.round((result.total / Math.max(wordCount, 1)) * 100 * 3));

    // Polarity bar
    const barLen = 20;
    const filled = Math.round(((result.score + 1) / 2) * barLen);
    const bar = '🟥'.repeat(Math.max(0, barLen / 2 - filled)) +
                '⬜'.repeat(Math.min(filled, barLen / 2)) +
                '🟩'.repeat(Math.min(filled, barLen / 2));

    const embed = new EmbedBuilder()
      .setTitle(`${sentimentEmoji} Sentiment Analysis`)
      .setColor(color)
      .addFields(
        { name: '📊 Sentiment',   value: `**${sentiment}**`,             inline: true },
        { name: '🎭 Tone',        value: tone,                            inline: true },
        { name: '📈 Polarity',    value: `${result.score > 0 ? '+' : ''}${result.score.toFixed(2)} (${pct}% positive)`, inline: true },
        { name: '🔵 Confidence',  value: `${confidence}%`,               inline: true },
        { name: '✅ Positive cues',value: result.positive.toString(),     inline: true },
        { name: '❌ Negative cues',value: result.negative.toString(),     inline: true },
        { name: '📏 Words',       value: wordCount.toString(),            inline: true },
        { name: '📖 Sentences',   value: result.sentences.toString(),     inline: true },
        { name: '📉 Polarity Bar',value: bar,                            inline: false },
      )
      .setFooter({ text: 'Rule-based NLP analysis • Results are approximate' })
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
} satisfies CommandDefinition;
