import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "verifymethod",
    description: "Set or view the verification method. button=free, captcha/math/image=⭐ Premium",
    category: "Verification",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("set").setDescription("Set the verification method")
        .addStringOption((o) => o.setName("method").setDescription("Verification method").setRequired(true)
        .addChoices({ name: "Button (Free)", value: "button" }, { name: "Captcha (⭐ Premium)", value: "captcha" }, { name: "Math Problem (⭐ Premium)", value: "math" }, { name: "Image CAPTCHA (⭐ Premium)", value: "image" })))
        .addSubcommand((s) => s.setName("view").setDescription("View the current method")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "view");
        if (sub === "set") {
            const method = ctx.isSlash ? ctx.interaction.options.getString("method", true) : ctx.args[1]?.toLowerCase();
            const valid = ["button", "captcha", "math", "image"];
            if (!method || !valid.includes(method)) {
                await ctx.reply({ embeds: [errorEmbed(`Invalid method. Choose from: ${valid.join(", ")}`)] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "verification.method": method } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Verification method set to **${method}**${method !== "button" ? " ⭐" : ""}.`)] });
        }
        else {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const method = cfg?.verification?.method ?? "button";
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("✅ Verification Method").setDescription(`Current method: **${method}**\n\n• **button** — Click to verify (Free)\n• **captcha** — Text CAPTCHA (⭐)\n• **math** — Math problem (⭐)\n• **image** — Image CAPTCHA (⭐)`)] });
        }
    },
};
export default command;
//# sourceMappingURL=verifyMethod.js.map