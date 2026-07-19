import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";
const command = {
    name: "xpmultiplier",
    description: "⭐ Set a server-wide XP multiplier (0.1x–10x). Premium only.",
    category: "Leveling",
    access: "admin",
    premium: true,
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    aliases: ["xpmulti", "levelmultiplier"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("set").setDescription("Set the XP multiplier")
        .addNumberOption((o) => o.setName("multiplier").setDescription("XP multiplier (0.1–10)").setRequired(true).setMinValue(0.1).setMaxValue(10)))
        .addSubcommand((s) => s.setName("view").setDescription("View the current XP multiplier"))
        .addSubcommand((s) => s.setName("reset").setDescription("Reset multiplier to 1x")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "view");
        if (sub === "set") {
            const multi = ctx.isSlash ? ctx.interaction.options.getNumber("multiplier", true) : parseFloat(ctx.args[1] ?? "1");
            if (isNaN(multi) || multi < 0.1 || multi > 10) {
                await ctx.reply({ embeds: [errorEmbed("Multiplier must be between 0.1 and 10.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "leveling.xpMultiplier": multi } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`XP multiplier set to **${multi}x**. Members will earn ${multi}× the base XP per message.`)] });
        }
        else if (sub === "reset") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "leveling.xpMultiplier": 1 } });
            await ctx.reply({ embeds: [successEmbed("XP multiplier reset to **1x**.")] });
        }
        else {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const multi = cfg?.leveling?.xpMultiplier ?? 1;
            await ctx.reply({ embeds: [baseEmbed("premium").setTitle("⭐ XP Multiplier").setDescription(`Current multiplier: **${multi}x**\n\nXP earned per message is multiplied by this value for all members.`)] });
        }
    },
};
export default command;
//# sourceMappingURL=xpMultiplier.js.map