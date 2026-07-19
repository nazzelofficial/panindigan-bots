import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";

function toMockCase(s: string): string {
  return s.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
}

function toSmallCaps(s: string): string {
  const map: Record<string, string> = {
    a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ꜰ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",k:"ᴋ",l:"ʟ",m:"ᴍ",
    n:"ɴ",o:"ᴏ",p:"ᴘ",q:"ǫ",r:"ʀ",s:"s",t:"ᴛ",u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ",
  };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("");
}

function toFullwidth(s: string): string {
  return s.split("").map((c) => {
    const code = c.charCodeAt(0);
    if (code >= 33 && code <= 126) return String.fromCharCode(code + 65248);
    return c;
  }).join("");
}

function toBinary(s: string): string {
  return s.split("").map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

const command: CommandDefinition = {
  name: "text",
  description: "Mga text manipulation tools: reverse, mock, upper, lower, count, smallcaps, fullwidth, binary",
  category: "Utility",
  access: "general",
  guildOnly: false,
  cooldown: 3,
  aliases: ["textutil", "txt"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("reverse").setDescription("I-reverse ang text")
          .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true).setMaxLength(500)),
      )
      .addSubcommand((s) =>
        s.setName("mock").setDescription("i lIkE tHiS mOcK tExT sTyLe")
          .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true).setMaxLength(500)),
      )
      .addSubcommand((s) =>
        s.setName("upper").setDescription("UPPERCASE ng text")
          .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true).setMaxLength(500)),
      )
      .addSubcommand((s) =>
        s.setName("lower").setDescription("lowercase ng text")
          .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true).setMaxLength(500)),
      )
      .addSubcommand((s) =>
        s.setName("count").setDescription("Bilangin ang characters, words, at lines")
          .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true).setMaxLength(1000)),
      )
      .addSubcommand((s) =>
        s.setName("smallcaps").setDescription("ᴄᴏɴᴠᴇʀᴛ ᴛᴏ sᴍᴀʟʟ ᴄᴀᴘs")
          .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true).setMaxLength(300)),
      )
      .addSubcommand((s) =>
        s.setName("fullwidth").setDescription("Ｃｏｎｖｅｒｔ　ｔｏ　ｆｕｌｌｗｉｄｔｈ")
          .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true).setMaxLength(300)),
      )
      .addSubcommand((s) =>
        s.setName("binary").setDescription("I-convert ang text sa binary")
          .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true).setMaxLength(50)),
      ),
  async execute(ctx) {
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
    const input = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.slice(1).join(" ");

    if (!sub) { await ctx.reply({ embeds: [errorEmbed("Subcommands: reverse | mock | upper | lower | count | smallcaps | fullwidth | binary")] }); return; }
    if (!input && sub !== "count") { await ctx.reply({ embeds: [errorEmbed("Provide a text.")] }); return; }

    let result = "";
    let title = "";

    switch (sub) {
      case "reverse":
        result = input.split("").reverse().join("");
        title = "⬅️ Reversed Text";
        break;
      case "mock":
        result = toMockCase(input);
        title = "🤪 mOcK tExT";
        break;
      case "upper":
        result = input.toUpperCase();
        title = "🔠 UPPERCASE";
        break;
      case "lower":
        result = input.toLowerCase();
        title = "🔡 lowercase";
        break;
      case "count": {
        const chars = input.length;
        const charsNoSpace = input.replace(/\s/g, "").length;
        const words = countWords(input);
        const lines = input.split("\n").length;
        const embed = baseEmbed("primary").setTitle("🔢 Character Count").addFields(
          { name: "Characters (with spaces)", value: String(chars), inline: true },
          { name: "Characters (no spaces)", value: String(charsNoSpace), inline: true },
          { name: "Words", value: String(words), inline: true },
          { name: "Lines", value: String(lines), inline: true },
        );
        await ctx.reply({ embeds: [embed] });
        return;
      }
      case "smallcaps":
        result = toSmallCaps(input);
        title = "ꜱᴍᴀʟʟ ᴄᴀᴘꜱ";
        break;
      case "fullwidth":
        result = toFullwidth(input);
        title = "Ｆｕｌｌｗｉｄｔｈ";
        break;
      case "binary":
        result = toBinary(input);
        title = "01 Binary";
        break;
      default:
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand.")] });
        return;
    }

    if (result.length > 1900) result = result.slice(0, 1900) + "...";

    await ctx.reply({
      embeds: [
        baseEmbed("primary")
          .setTitle(title)
          .addFields(
            { name: "Input", value: input.slice(0, 500), inline: false },
            { name: "Output", value: result, inline: false },
          ),
      ],
    });
  },
};

export default command;
