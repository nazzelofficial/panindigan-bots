import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { getOpenAiClient, isAiConfigured } from "../../features/ai/openaiClient.js";

const command: CommandDefinition = {
  name: "chat",
  description: "Chat with the AI assistant",
  category: "AI",
  access: "general",
  guildOnly: false,
  cooldown: 5,
  aliases: ["ask", "ai"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("message").setDescription("Your message to the AI").setRequired(true).setMaxLength(1000))
      .addStringOption((o) => o.setName("persona").setDescription("Optional persona override (e.g. 'Helpful assistant')").setRequired(false)),
  async execute(ctx) {
    if (!isAiConfigured()) {
      await ctx.reply({ embeds: [errorEmbed("AI features aren't configured yet — set `OPENAI_API_KEY` in the environment.")] });
      return;
    }
    const message = ctx.isSlash ? ctx.interaction!.options.getString("message", true) : ctx.args.join(" ");
    if (!message) { await ctx.reply({ embeds: [errorEmbed("Please provide a message.")] }); return; }
    const persona = ctx.isSlash ? (ctx.interaction!.options.getString("persona") ?? null) : null;

    if (ctx.isSlash) await ctx.interaction!.deferReply();
    else await ctx.reply({ embeds: [baseEmbed("primary").setDescription("🤔 Thinking...")] });

    try {
      const openai = getOpenAiClient();
      const systemPrompt = persona
        ? `You are ${persona}. Be helpful, concise, and friendly.`
        : "You are Panindigan, a helpful AI assistant for Filipino Discord communities. Be friendly, helpful, and concise. Support both English and Filipino.";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
      const embed = baseEmbed("primary")
        .setTitle("🤖 AI Response")
        .addFields(
          { name: "Your Message", value: message.length > 200 ? message.slice(0, 200) + "…" : message },
          { name: "Response", value: reply.length > 1000 ? reply.slice(0, 1000) + "…" : reply },
        )
        .setFooter({ text: `Asked by ${ctx.isSlash ? ctx.interaction!.user.tag : ctx.message!.author.tag}` });

      if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [embed] });
      else await (ctx.message as any)?.edit?.({ embeds: [embed] }) ?? await ctx.reply({ embeds: [embed] });
    } catch (err: any) {
      const errEmbed = errorEmbed(`AI request failed: ${err.message}`);
      if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [errEmbed] }).catch(() => {});
      else await ctx.reply({ embeds: [errEmbed] });
    }
  },
};
export default command;
