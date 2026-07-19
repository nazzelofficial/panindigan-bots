/**
 * EmbedFactory — unified embed builder for every embed type used in the bot.
 * Import this instead of the individual helper functions in src/utils/embeds.ts.
 * The helpers in embeds.ts are kept as aliases for backward compatibility.
 */
import { EmbedBuilder } from "discord.js";
import { config } from "../config/config";
function base(color) {
    return new EmbedBuilder()
        .setColor(config.colors[color])
        .setTimestamp();
}
export class EmbedFactory {
    /** ✅ Green — operation completed successfully. */
    static success(description, title) {
        const e = base("success").setDescription(`✅ ${description}`);
        if (title)
            e.setTitle(title);
        return e;
    }
    /** ❌ Red — something went wrong. */
    static error(description, title) {
        const e = base("danger").setDescription(`❌ ${description}`);
        if (title)
            e.setTitle(title);
        return e;
    }
    /** ⚠️ Yellow — non-fatal warning or notice. */
    static warning(description, title) {
        const e = base("warning").setDescription(`⚠️ ${description}`);
        if (title)
            e.setTitle(title);
        return e;
    }
    /** ℹ️ Blue — neutral information. */
    static info(description, title) {
        const e = base("info").setDescription(`ℹ️ ${description}`);
        if (title)
            e.setTitle(title);
        return e;
    }
    /** ⏳ Grey — background operation in progress. */
    static loading(description, title) {
        const e = new EmbedBuilder()
            .setColor(0x808080)
            .setTimestamp()
            .setDescription(`⏳ ${description}`);
        if (title)
            e.setTitle(title);
        return e;
    }
    /** ❓ Orange — prompts a yes/no confirmation from the user. */
    static confirm(description, title) {
        const e = new EmbedBuilder()
            .setColor(0xe67e22)
            .setTimestamp()
            .setDescription(`❓ ${description}`);
        if (title)
            e.setTitle(title);
        return e;
    }
    /** ⭐ Gold — premium-gated feature notice. */
    static premium(description, title) {
        const e = base("premium").setDescription(`⭐ ${description}`);
        if (title)
            e.setTitle(title);
        return e;
    }
    /** 🎛️ Blurple — dashboard or settings output. */
    static dashboard(description, title) {
        const e = base("primary").setDescription(`🎛️ ${description}`);
        if (title)
            e.setTitle(title);
        return e;
    }
    /**
     * Generic base embed — use when none of the typed variants fit.
     * Accepts a key from config.colors.
     */
    static base(color = "primary") {
        return base(color);
    }
}
//# sourceMappingURL=EmbedFactory.js.map