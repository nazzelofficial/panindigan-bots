import { errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "voicetotext",
    description: "Transcribe an audio file attachment using AI (Whisper)",
    category: "AI",
    access: "general",
    guildOnly: false,
    cooldown: 30,
    aliases: ["transcribe", "stt"],
    slashData: (b) => b
        .addAttachmentOption((o) => o.setName("audio").setDescription("Audio file to transcribe (mp3, mp4, m4a, wav, ogg, webm)").setRequired(true))
        .addStringOption((o) => o.setName("language").setDescription("Language hint (e.g. en, fil, es)").setRequired(false)),
    async execute(ctx) {
        await ctx.reply({ embeds: [errorEmbed("⚠️ Audio transcription is not available with the current AI provider. This feature requires a provider that supports speech-to-text APIs.")] });
    },
};
export default command;
//# sourceMappingURL=voicetotext.js.map