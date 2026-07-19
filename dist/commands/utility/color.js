import { AttachmentBuilder } from "discord.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds";
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
const command = {
    name: "color",
    description: "Preview a color by hex code, RGB, or random",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 5,
    aliases: ["colour", "hex"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("value").setDescription("Hex (#ff0000), RGB (255,0,0), or 'random'").setRequired(false)),
    async execute(ctx) {
        const raw = (ctx.isSlash ? ctx.interaction.options.getString("value") : ctx.args.join(" ")) ?? "random";
        let hex;
        if (raw.toLowerCase() === "random") {
            hex = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
        }
        else if (raw.includes(",")) {
            const parts = raw.split(",").map((p) => parseInt(p.trim()));
            if (parts.length < 3 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
                await ctx.reply({ embeds: [errorEmbed("Invalid RGB format. Use `R,G,B` e.g. `255,128,0`.")] });
                return;
            }
            hex = `#${parts.map((p) => p.toString(16).padStart(2, "0")).join("")}`;
        }
        else {
            hex = raw.startsWith("#") ? raw : `#${raw}`;
            if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
                await ctx.reply({ embeds: [errorEmbed("Invalid hex color. Use format `#RRGGBB` or `RRGGBB`.")] });
                return;
            }
        }
        const rgb = hexToRgb(hex);
        if (!rgb) {
            await ctx.reply({ embeds: [errorEmbed("Invalid color value.")] });
            return;
        }
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        let attachment = null;
        try {
            const { createCanvas } = await import("@napi-rs/canvas");
            const canvas = createCanvas(200, 80);
            const c = canvas.getContext("2d");
            c.fillStyle = hex;
            c.beginPath();
            c.roundRect(0, 0, 200, 80, 16);
            c.fill();
            attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "color.png" });
        }
        catch { /* canvas optional */ }
        const embed = baseEmbed(hex)
            .setTitle(`🎨 Color Preview`)
            .addFields({ name: "HEX", value: `\`${hex.toUpperCase()}\``, inline: true }, { name: "RGB", value: `\`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\``, inline: true }, { name: "HSL", value: `\`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)\``, inline: true });
        if (attachment) {
            embed.setThumbnail("attachment://color.png");
            await ctx.reply({ embeds: [embed], files: [attachment] });
        }
        else {
            await ctx.reply({ embeds: [embed] });
        }
    },
};
export default command;
//# sourceMappingURL=color.js.map