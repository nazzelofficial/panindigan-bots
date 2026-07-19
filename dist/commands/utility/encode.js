import { baseEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "encode",
    description: "Encode or decode text: base64, URL encoding, binary, hex, morse",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 3,
    aliases: ["decode", "b64"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("base64encode").setDescription("I-encode ang text sa Base64")
        .addStringOption((o) => o.setName("text").setDescription("Text na ie-encode").setRequired(true).setMaxLength(1000)))
        .addSubcommand((s) => s.setName("base64decode").setDescription("I-decode ang Base64 text")
        .addStringOption((o) => o.setName("text").setDescription("Base64 string na didi-decode").setRequired(true).setMaxLength(1500)))
        .addSubcommand((s) => s.setName("urlencode").setDescription("I-URL-encode ang text")
        .addStringOption((o) => o.setName("text").setDescription("Text na ie-encode").setRequired(true).setMaxLength(500)))
        .addSubcommand((s) => s.setName("urldecode").setDescription("I-URL-decode ang text")
        .addStringOption((o) => o.setName("text").setDescription("URL-encoded string").setRequired(true).setMaxLength(1000)))
        .addSubcommand((s) => s.setName("hex").setDescription("I-convert ang text sa hex")
        .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true).setMaxLength(200)))
        .addSubcommand((s) => s.setName("unhex").setDescription("I-convert ang hex sa text")
        .addStringOption((o) => o.setName("text").setDescription("Hex string").setRequired(true).setMaxLength(500)))
        .addSubcommand((s) => s.setName("morse").setDescription("I-convert ang text sa Morse code")
        .addStringOption((o) => o.setName("text").setDescription("Text (letters at numbers lang)").setRequired(true).setMaxLength(200)))
        .addSubcommand((s) => s.setName("unmorse").setDescription("I-convert ang Morse code sa text")
        .addStringOption((o) => o.setName("text").setDescription("Morse code (dots at dashes, spaces between letters)").setRequired(true).setMaxLength(500))),
    async execute(ctx) {
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        const input = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.slice(1).join(" ");
        if (!sub || !input) {
            await ctx.reply({ embeds: [errorEmbed("Subcommands: base64encode | base64decode | urlencode | urldecode | hex | unhex | morse | unmorse")] });
            return;
        }
        const MORSE = {
            a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--",
            n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..",
            "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
            " ": "/", ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "-": "-....-", ":": "---...",
        };
        const MORSE_REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
        let result = "";
        let title = "";
        try {
            switch (sub) {
                case "base64encode":
                    result = Buffer.from(input, "utf8").toString("base64");
                    title = "🔡 Base64 Encoded";
                    break;
                case "base64decode":
                    result = Buffer.from(input, "base64").toString("utf8");
                    title = "🔓 Base64 Decoded";
                    break;
                case "urlencode":
                    result = encodeURIComponent(input);
                    title = "🌐 URL Encoded";
                    break;
                case "urldecode":
                    result = decodeURIComponent(input);
                    title = "🌐 URL Decoded";
                    break;
                case "hex":
                    result = Buffer.from(input, "utf8").toString("hex");
                    title = "🔢 Hex Encoded";
                    break;
                case "unhex":
                    result = Buffer.from(input.replace(/\s/g, ""), "hex").toString("utf8");
                    title = "🔢 Hex Decoded";
                    break;
                case "morse":
                    result = input.toLowerCase().split("").map((c) => MORSE[c] ?? "?").join(" ");
                    title = "📡 Morse Code";
                    break;
                case "unmorse":
                    result = input.split(" ").map((c) => MORSE_REV[c] ?? "?").join("").toUpperCase();
                    title = "📡 Morse Decoded";
                    break;
                default:
                    await ctx.reply({ embeds: [errorEmbed("Unknown subcommand.")] });
                    return;
            }
        }
        catch (e) {
            await ctx.reply({ embeds: [errorEmbed(`Nagkaroon ng error sa pagproseso: ${e.message}`)] });
            return;
        }
        if (result.length > 1900)
            result = result.slice(0, 1900) + "...";
        await ctx.reply({
            embeds: [
                baseEmbed("primary")
                    .setTitle(title)
                    .addFields({ name: "Input", value: `\`\`\`${input.slice(0, 400)}\`\`\``, inline: false }, { name: "Output", value: `\`\`\`${result.slice(0, 1000)}\`\`\``, inline: false }),
            ],
        });
    },
};
export default command;
//# sourceMappingURL=encode.js.map