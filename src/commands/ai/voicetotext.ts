import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
import { getOpenAiClient, isAiConfigured } from "@/features/ai/openaiClient";

const command: CommandDefinition = {
  name: "voicetotext",
  description: "Transcribe an audio file attachment using AI (Whisper)",
  category: "AI",
  access: "general",
  guildOnly: false,
  cooldown: 30,
  aliases: ["transcribe", "stt"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addAttachmentOption((o) => o.setName("audio").setDescription("Audio file to transcribe (mp3, mp4, m4a, wav, ogg, webm)").setRequired(true))
      .addStringOption((o) => o.setName("language").setDescription("Language hint (e.g. en, fil, es)").setRequired(false)),
  async execute(ctx) {
    if (!isAiConfigured()) {
      await ctx.reply({ embeds: [errorEmbed("AI features aren't configured — set `OPENAI_API_KEY`.")] });
      return;
    }
    const audio = ctx.isSlash ? ctx.interaction!.options.getAttachment("audio", true) : null;
    if (!audio) {
      await ctx.reply({ embeds: [errorEmbed("Please attach an audio file (mp3, m4a, wav, ogg, webm).")] });
      return;
    }
    const SUPPORTED = ["mp3", "mp4", "m4a", "wav", "ogg", "webm", "flac"];
    const ext = audio.name.split(".").pop()?.toLowerCase() ?? "";
    if (!SUPPORTED.includes(ext)) {
      await ctx.reply({ embeds: [errorEmbed(`Unsupported format \`.${ext}\`. Supported: ${SUPPORTED.join(", ")}`)] });
      return;
    }
    if (ctx.isSlash) await ctx.interaction!.deferReply();
    try {
      const openai = getOpenAiClient();
      const lang = ctx.isSlash ? (ctx.interaction!.options.getString("language") ?? undefined) : undefined;
      // Fetch audio file and send to Whisper
      const resp = await fetch(audio.url);
      if (!resp.ok) throw new Error("Failed to download audio file.");
      const blob = await resp.blob();
      const file = new File([blob], audio.name, { type: audio.contentType ?? "audio/mpeg" });
      const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1", file, language: lang,
      });
      const text = transcription.text || "(No speech detected)";
      const embed = baseEmbed("primary")
        .setTitle("🎤 Transcription")
        .addFields(
          { name: "File", value: `\`${audio.name}\`` },
          { name: "Transcript", value: text.length > 1800 ? text.slice(0, 1800) + "…" : text },
        )
        .setFooter({ text: `${lang ? `Language: ${lang} • ` : ""}Powered by OpenAI Whisper` });
      if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [embed] });
      else await ctx.reply({ embeds: [embed] });
    } catch (err: any) {
      const e = errorEmbed(`Transcription failed: ${err.message}`);
      if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [e] }).catch(() => {});
      else await ctx.reply({ embeds: [e] });
    }
  },
};
export default command;
