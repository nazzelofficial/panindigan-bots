import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { getGroqClient, getAiModel, isAiConfigured } from "../../features/ai/openaiClient.js";

const command: CommandDefinition = {
  name: "codeexplain",
  description: "Explain a piece of code in plain language",
  category: "AI",
  access: "general",
  guildOnly: false,
  cooldown: 10,
  aliases: ["explain", "whatiscode"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("code").setDescription("The code to explain").setRequired(true).setMaxLength(1500))
      .addStringOption((o) => o.setName("level").setDescription("Explanation level").setRequired(false)
        .addChoices({ name: "Beginner", value: "beginner" }, { name: "Intermediate", value: "intermediate" }, { name: "Expert", value: "expert" })),
  async execute(ctx) {
    if (!isAiConfigured()) {
      await ctx.reply({ embeds: [errorEmbed("⚠️ AI service is temporarily unavailable.")] });
      return;
    }
    const code = ctx.isSlash ? ctx.interaction!.options.getString("code", true) : ctx.args.join(" ");
    const level = ctx.isSlash ? (ctx.interaction!.options.getString("level") ?? "intermediate") : "intermediate";
    if (!code) { await ctx.reply({ embeds: [errorEmbed("Please provide code to explain.")] }); return; }

    if (ctx.isSlash) await ctx.interaction!.deferReply();

    try {
      const groq = getGroqClient();
      const model = getAiModel();
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: `You are a programming teacher. Explain the following code at a ${level} level. Be concise and clear. Identify the language, explain what it does step-by-step, and mention any notable patterns or potential issues.` },
          { role: "user", content: code },
        ],
        max_tokens: 900,
        temperature: 0.3,
      });
      const explanation = completion.choices[0]?.message?.content ?? "Unable to explain this code.";
      const embed = baseEmbed("primary")
        .setTitle("📚 Code Explanation")
        .addFields(
          { name: "Code", value: `\`\`\`\n${code.length > 500 ? code.slice(0, 500) + "…" : code}\n\`\`\`` },
          { name: `Explanation (${level})`, value: explanation.length > 1000 ? explanation.slice(0, 1000) + "…" : explanation },
        );
      if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [embed] });
      else await ctx.reply({ embeds: [embed] });
    } catch (err: any) {
      console.error("[AI] Codeexplain command error:", err);
      const e = errorEmbed("⚠️ AI service is temporarily unavailable. Please try again in a moment.");
      if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [e] }).catch(() => {});
      else await ctx.reply({ embeds: [e] });
    }
  },
};
export default command;
