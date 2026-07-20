import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import * as crypto from "node:crypto";
const ALGORITHMS = ["md5", "sha1", "sha256", "sha512", "sha3-256", "sha3-512"];
const command = {
    name: "hash",
    description: "Generate hash ng isang text gamit ang iba't ibang algorithm",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 3,
    aliases: ["hashgen", "checksum"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("text").setDescription("Text na ia-hash").setRequired(true).setMaxLength(1000))
        .addStringOption((o) => o.setName("algorithm").setDescription("Hash algorithm (default: sha256)").setRequired(false)
        .addChoices({ name: "MD5", value: "md5" }, { name: "SHA-1", value: "sha1" }, { name: "SHA-256 (default)", value: "sha256" }, { name: "SHA-512", value: "sha512" }, { name: "SHA3-256", value: "sha3-256" }, { name: "SHA3-512", value: "sha3-512" }))
        .addBooleanOption((o) => o.setName("all").setDescription("Show lahat ng algorithms?").setRequired(false)),
    async execute(ctx) {
        const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.slice(1).join(" ");
        const algo = (ctx.isSlash ? ctx.interaction.options.getString("algorithm") : ctx.args[0]) ?? "sha256";
        const showAll = (ctx.isSlash ? ctx.interaction.options.getBoolean("all") : false) ?? false;
        if (!text) {
            await ctx.reply({ embeds: [errorEmbed("Provide a text na ia-hash.")] });
            return;
        }
        if (showAll) {
            const embed = baseEmbed("primary")
                .setTitle("🔐 Hash Results")
                .addFields(ALGORITHMS.map((a) => ({
                name: a.toUpperCase(),
                value: `\`${crypto.createHash(a).update(text).digest("hex")}\``,
                inline: false,
            })))
                .setFooter({ text: "Input text is not stored or logged." });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        if (!ALGORITHMS.includes(algo)) {
            await ctx.reply({ embeds: [errorEmbed(`Invalid algorithm. Available: ${ALGORITHMS.join(", ")}`)] });
            return;
        }
        let hash;
        try {
            hash = crypto.createHash(algo).update(text, "utf8").digest("hex");
        }
        catch {
            await ctx.reply({ embeds: [errorEmbed(`Algorithm na \`${algo}\` ay hindi supported.`)] });
            return;
        }
        await ctx.reply({
            embeds: [
                baseEmbed("primary")
                    .setTitle(`🔐 ${algo.toUpperCase()} Hash`)
                    .addFields({ name: "Input", value: `\`\`\`${text.slice(0, 200)}\`\`\``, inline: false }, { name: "Hash", value: `\`\`\`${hash}\`\`\``, inline: false }, { name: "Length", value: `${hash.length} hex chars / ${hash.length / 2} bytes`, inline: true })
                    .setFooter({ text: "Input text is not stored or logged." }),
            ],
        });
    },
};
export default command;
//# sourceMappingURL=hash.js.map