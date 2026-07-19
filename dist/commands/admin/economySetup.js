import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";
const command = {
    name: "economysetup",
    description: "Configure economy settings for this server (currency name, starting balance, etc.)",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    aliases: ["ecosetup", "setupeconomy"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("currency")
        .setDescription("Set the currency name and symbol")
        .addStringOption((o) => o.setName("name").setDescription('Currency name (e.g. "Coins")').setRequired(true).setMaxLength(32))
        .addStringOption((o) => o.setName("symbol").setDescription('Currency symbol (e.g. "🪙")').setRequired(false).setMaxLength(8)))
        .addSubcommand((s) => s
        .setName("starting")
        .setDescription("Set the starting balance for new members")
        .addIntegerOption((o) => o.setName("amount").setDescription("Starting coins").setRequired(true).setMinValue(0).setMaxValue(100000)))
        .addSubcommand((s) => s.setName("view").setDescription("View current economy configuration"))
        .addSubcommand((s) => s.setName("reset").setDescription("Reset economy config to defaults")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "currency") {
            const name = ctx.isSlash
                ? ctx.interaction.options.getString("name", true)
                : ctx.args[1];
            const symbol = ctx.isSlash
                ? ctx.interaction.options.getString("symbol") ?? "🪙"
                : ctx.args[2] ?? "🪙";
            if (!name) {
                await ctx.reply({ embeds: [errorEmbed("Please provide a currency name.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "economy.currencyName": name, "economy.currencySymbol": symbol } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Currency set to **${symbol} ${name}**.`)] });
        }
        else if (sub === "starting") {
            const amount = ctx.isSlash
                ? ctx.interaction.options.getInteger("amount", true)
                : parseInt(ctx.args[1] ?? "0", 10);
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "economy.startingBalance": amount } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Starting balance set to **${amount.toLocaleString()}** coins.`)] });
        }
        else if (sub === "view") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const eco = cfg?.economy ?? {};
            const embed = baseEmbed("primary")
                .setTitle("💰 Economy Configuration")
                .addFields({ name: "Currency", value: `${eco.currencySymbol ?? "🪙"} ${eco.currencyName ?? "Coins"}`, inline: true }, { name: "Starting Balance", value: `${(eco.startingBalance ?? 0).toLocaleString()}`, inline: true }, { name: "Tax Rate", value: `${eco.taxRate ?? 0}%`, inline: true });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "reset") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { economy: {} } });
            await ctx.reply({ embeds: [successEmbed("Economy settings have been reset to defaults.")] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: currency | starting | view | reset")] });
        }
    },
};
export default command;
//# sourceMappingURL=economySetup.js.map