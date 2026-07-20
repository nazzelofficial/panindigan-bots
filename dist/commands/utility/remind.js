import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed, baseEmbed, infoEmbed } from "../../utils/embeds.js";
function parseDuration(str) {
    const match = str?.match(/^(\d+)(s|m|h|d|w)$/i);
    if (!match)
        return null;
    const v = parseInt(match[1]);
    const u = match[2].toLowerCase();
    const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
    return v * (map[u] ?? 0);
}
const command = {
    name: "remind",
    description: "Set, list, or delete reminders",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 5,
    aliases: ["reminder", "remindme"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("set")
        .setDescription("Set a reminder")
        .addStringOption((o) => o.setName("duration").setDescription("When e.g. 10m, 2h, 1d").setRequired(true))
        .addStringOption((o) => o.setName("text").setDescription("Reminder text").setRequired(true)))
        .addSubcommand((s) => s.setName("list").setDescription("List your pending reminders"))
        .addSubcommand((s) => s.setName("delete")
        .setDescription("Delete a reminder by ID")
        .addStringOption((o) => o.setName("id").setDescription("Reminder ID from the list").setRequired(true))),
    async execute(ctx) {
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "set";
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        if (sub === "set") {
            const durationStr = ctx.isSlash ? ctx.interaction.options.getString("duration", true) : ctx.args[1];
            const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.slice(2).join(" ");
            if (!durationStr || !text) {
                await ctx.reply({ embeds: [errorEmbed("Provide duration and reminder text.")] });
                return;
            }
            const ms = parseDuration(durationStr);
            if (!ms || ms < 10_000) {
                await ctx.reply({ embeds: [errorEmbed("Invalid duration. Use e.g. `10m`, `2h`, `1d`. Minimum: 10 seconds.")] });
                return;
            }
            if (user.reminders.length >= 10) {
                await ctx.reply({ embeds: [errorEmbed("You can have at most 10 active reminders.")] });
                return;
            }
            const channelId = ctx.interaction?.channelId ?? ctx.message?.channelId ?? "0";
            const id = `r_${Date.now().toString(36)}`;
            user.reminders.push({ id, text, remindAt: new Date(Date.now() + ms), channelId, createdAt: new Date() });
            await user.save();
            const remindAt = Math.floor((Date.now() + ms) / 1000);
            await ctx.reply({ embeds: [successEmbed(`⏰ Reminder set! I'll remind you <t:${remindAt}:R>.\n> ${text}`)] });
        }
        else if (sub === "list") {
            if (!user.reminders.length) {
                await ctx.reply({ embeds: [infoEmbed("You have no active reminders.")] });
                return;
            }
            const embed = baseEmbed("primary")
                .setTitle("⏰ Your Reminders")
                .setDescription(user.reminders
                .map((r, i) => `**${i + 1}.** \`${r.id}\` — <t:${Math.floor(new Date(r.remindAt).getTime() / 1000)}:R>\n> ${r.text.slice(0, 80)}`)
                .join("\n\n"))
                .setFooter({ text: `${user.reminders.length}/10 reminders` });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "delete") {
            const id = ctx.isSlash ? ctx.interaction.options.getString("id", true) : ctx.args[1];
            const before = user.reminders.length;
            user.reminders = user.reminders.filter((r) => r.id !== id);
            if (user.reminders.length === before) {
                await ctx.reply({ embeds: [errorEmbed("Reminder not found.")] });
                return;
            }
            await user.save();
            await ctx.reply({ embeds: [successEmbed("Reminder deleted.")] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: set | list | delete")] });
        }
    },
};
export default command;
//# sourceMappingURL=remind.js.map