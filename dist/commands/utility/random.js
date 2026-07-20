import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import * as crypto from "node:crypto";
const command = {
    name: "random",
    description: "Iba't ibang random generators: number, dice, uuid, coin, color, pick",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 3,
    aliases: ["rand", "rng"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("number").setDescription("Random na numero sa loob ng range")
        .addIntegerOption((o) => o.setName("min").setDescription("Minimum (default: 1)").setRequired(false))
        .addIntegerOption((o) => o.setName("max").setDescription("Maximum (default: 100)").setRequired(false)))
        .addSubcommand((s) => s.setName("dice").setDescription("Magtapon ng dice")
        .addStringOption((o) => o.setName("type").setDescription("Dice type (default: d6)").setRequired(false)
        .addChoices({ name: "d4", value: "4" }, { name: "d6", value: "6" }, { name: "d8", value: "8" }, { name: "d10", value: "10" }, { name: "d12", value: "12" }, { name: "d20", value: "20" }, { name: "d100", value: "100" }))
        .addIntegerOption((o) => o.setName("count").setDescription("Ilang dice? (1-10)").setRequired(false).setMinValue(1).setMaxValue(10)))
        .addSubcommand((s) => s.setName("uuid").setDescription("Create random UUID v4"))
        .addSubcommand((s) => s.setName("coin").setDescription("Flip a coin"))
        .addSubcommand((s) => s.setName("color").setDescription("Create random hex color"))
        .addSubcommand((s) => s.setName("pick").setDescription("Pumili ng random mula sa listahan")
        .addStringOption((o) => o.setName("items").setDescription("Mga pagpipilian, hiwalay ng comma").setRequired(true)))
        .addSubcommand((s) => s.setName("percent").setDescription("Random na percentage (0–100%)")),
    async execute(ctx) {
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "number");
        if (sub === "number") {
            const min = (ctx.isSlash ? ctx.interaction.options.getInteger("min") : parseInt(ctx.args[1] ?? "1")) ?? 1;
            const max = (ctx.isSlash ? ctx.interaction.options.getInteger("max") : parseInt(ctx.args[2] ?? "100")) ?? 100;
            if (min > max) {
                await ctx.reply({ embeds: [errorEmbed("Ang min ay dapat mas mababa sa max.")] });
                return;
            }
            const result = Math.floor(Math.random() * (max - min + 1)) + min;
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🎲 Random Number").setDescription(`**${result.toLocaleString()}**`).addFields({ name: "Range", value: `${min.toLocaleString()} – ${max.toLocaleString()}`, inline: true })] });
            return;
        }
        if (sub === "dice") {
            const sides = parseInt((ctx.isSlash ? ctx.interaction.options.getString("type") : ctx.args[1]?.replace("d", "")) ?? "6");
            const count = (ctx.isSlash ? ctx.interaction.options.getInteger("count") : parseInt(ctx.args[2] ?? "1")) ?? 1;
            const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
            const total = rolls.reduce((a, b) => a + b, 0);
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle(`🎲 ${count}d${sides}`)
                        .addFields({ name: count > 1 ? "Rolls" : "Result", value: rolls.join(", "), inline: true }, ...(count > 1 ? [{ name: "Total", value: String(total), inline: true }] : [])),
                ],
            });
            return;
        }
        if (sub === "uuid") {
            const uuid = crypto.randomUUID();
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🆔 Random UUID v4").setDescription(`\`\`\`${uuid}\`\`\``)] });
            return;
        }
        if (sub === "coin") {
            const result = Math.random() < 0.5 ? "HEADS" : "TAILS";
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🪙 Coin Flip").setDescription(`**${result === "HEADS" ? "🟡 HEADS" : "⚪ TAILS"}**`)] });
            return;
        }
        if (sub === "color") {
            const hex = `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0").toUpperCase()}`;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle("🎨 Random Color")
                        .setColor(parseInt(hex.slice(1), 16))
                        .addFields({ name: "HEX", value: hex, inline: true }, { name: "RGB", value: `rgb(${r}, ${g}, ${b})`, inline: true }),
                ],
            });
            return;
        }
        if (sub === "pick") {
            const raw = ctx.isSlash ? ctx.interaction.options.getString("items", true) : ctx.args.slice(1).join(" ");
            const items = raw.split(",").map((i) => i.trim()).filter(Boolean);
            if (items.length < 2) {
                await ctx.reply({ embeds: [errorEmbed("Provide a kahit 2 items, hiwalay ng comma.")] });
                return;
            }
            const picked = items[Math.floor(Math.random() * items.length)];
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🎯 Random Pick").setDescription(`**${picked}**`).addFields({ name: "Pool", value: items.join(", ").slice(0, 500), inline: false })] });
            return;
        }
        if (sub === "percent") {
            const pct = Math.floor(Math.random() * 101);
            const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("📊 Random Percentage").setDescription(`${bar}\n**${pct}%**`)] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Gamitin ang: number | dice | uuid | coin | color | pick | percent")] });
    },
};
export default command;
//# sourceMappingURL=random.js.map