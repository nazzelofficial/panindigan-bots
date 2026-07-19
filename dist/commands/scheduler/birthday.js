import { PermissionFlagsBits } from "discord.js";
import { BirthdayModel } from "../../database/models/Community";
import { GuildModel } from "../../database/models/Guild";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const command = {
    name: "birthday",
    description: "Set, view, or manage birthdays",
    category: "Scheduler",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    aliases: ["bday"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("set")
        .setDescription("Set your birthday")
        .addIntegerOption((o) => o.setName("month").setDescription("Month (1-12)").setRequired(true).setMinValue(1).setMaxValue(12))
        .addIntegerOption((o) => o.setName("day").setDescription("Day (1-31)").setRequired(true).setMinValue(1).setMaxValue(31)))
        .addSubcommand((s) => s.setName("remove").setDescription("Remove your birthday"))
        .addSubcommand((s) => s.setName("view")
        .setDescription("View a user's birthday")
        .addUserOption((o) => o.setName("user").setDescription("User (default: you)").setRequired(false)))
        .addSubcommand((s) => s.setName("upcoming").setDescription("View upcoming birthdays in this server"))
        .addSubcommand((s) => s.setName("setchannel")
        .setDescription("Set the birthday announcement channel (Admin)")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel").setRequired(true)))
        .addSubcommand((s) => s.setName("setrole")
        .setDescription("Set the birthday role (Admin)")
        .addRoleOption((o) => o.setName("role").setDescription("Role to give on birthday").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "view";
        if (sub === "set") {
            const month = ctx.isSlash ? ctx.interaction.options.getInteger("month", true) : parseInt(ctx.args[1] ?? "0");
            const day = ctx.isSlash ? ctx.interaction.options.getInteger("day", true) : parseInt(ctx.args[2] ?? "0");
            if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
                await ctx.reply({ embeds: [errorEmbed("Invalid month/day.")] });
                return;
            }
            await BirthdayModel.findOneAndUpdate({ userId: ctx.userId }, { $set: { month, day }, $addToSet: { guildIds: guild.id } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`🎂 Birthday set to **${MONTHS[month - 1]} ${day}**!`)] });
        }
        else if (sub === "remove") {
            await BirthdayModel.findOneAndUpdate({ userId: ctx.userId }, { $pull: { guildIds: guild.id } });
            await ctx.reply({ embeds: [successEmbed("Birthday removed from this server.")] });
        }
        else if (sub === "view") {
            const target = ctx.isSlash ? ctx.interaction.options.getUser("user") ?? ctx.interaction.user : await ctx.client.users.fetch(ctx.userId);
            const bday = await BirthdayModel.findOne({ userId: target.id }).lean();
            if (!bday) {
                await ctx.reply({ embeds: [infoEmbed(`${target.username} has no birthday set.`)] });
                return;
            }
            const now = new Date();
            const nextYear = now.getMonth() + 1 > bday.month || (now.getMonth() + 1 === bday.month && now.getDate() > bday.day) ? now.getFullYear() + 1 : now.getFullYear();
            const nextDate = new Date(nextYear, bday.month - 1, bday.day);
            await ctx.reply({ embeds: [baseEmbed("warning").setTitle(`🎂 ${target.username}'s Birthday`).setDescription(`**${MONTHS[bday.month - 1]} ${bday.day}**\nNext birthday: <t:${Math.floor(nextDate.getTime() / 1000)}:R>`)] });
        }
        else if (sub === "upcoming") {
            const birthdays = await BirthdayModel.find({ guildIds: guild.id }).lean().limit(20);
            if (!birthdays.length) {
                await ctx.reply({ embeds: [infoEmbed("No birthdays set in this server.")] });
                return;
            }
            const now = new Date();
            const withNext = birthdays.map((b) => {
                let next = new Date(now.getFullYear(), b.month - 1, b.day);
                if (next <= now)
                    next = new Date(now.getFullYear() + 1, b.month - 1, b.day);
                return { ...b, nextDate: next };
            }).sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
            await ctx.reply({ embeds: [baseEmbed("warning").setTitle("🎂 Upcoming Birthdays").setDescription(withNext.slice(0, 15).map((b) => `<@${b.userId}> — **${MONTHS[b.month - 1]} ${b.day}** (<t:${Math.floor(b.nextDate.getTime() / 1000)}:R>)`).join("\n"))] });
        }
        else if (sub === "setchannel") {
            const member = ctx.interaction?.member ?? ctx.message?.member;
            if (!member?.permissions?.has(PermissionFlagsBits.ManageGuild)) {
                await ctx.reply({ embeds: [errorEmbed("Manage Server required.")] });
                return;
            }
            const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : guild.channels.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!channel?.isTextBased?.()) {
                await ctx.reply({ embeds: [errorEmbed("Provide a text channel.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { birthdayChannelId: channel.id } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Birthday announcements set to ${channel}.`)] });
        }
        else if (sub === "setrole") {
            const member = ctx.interaction?.member ?? ctx.message?.member;
            if (!member?.permissions?.has(PermissionFlagsBits.ManageGuild)) {
                await ctx.reply({ embeds: [errorEmbed("Manage Server required.")] });
                return;
            }
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { birthdayRoleId: role.id } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Birthday role set to ${role}.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: set | remove | view | upcoming | setchannel | setrole")] });
        }
    },
};
export default command;
//# sourceMappingURL=birthday.js.map