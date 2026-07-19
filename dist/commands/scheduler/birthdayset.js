import { BirthdayModel } from "@/database/models/Community";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const command = {
    name: "birthdayset",
    description: "Set your birthday",
    category: "Scheduler",
    access: "general",
    guildOnly: true,
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("month").setDescription("Month (1-12)").setRequired(true).setMinValue(1).setMaxValue(12))
        .addIntegerOption((o) => o.setName("day").setDescription("Day (1-31)").setRequired(true).setMinValue(1).setMaxValue(31)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const month = ctx.isSlash ? ctx.interaction.options.getInteger("month", true) : parseInt(ctx.args[0] ?? "0");
        const day = ctx.isSlash ? ctx.interaction.options.getInteger("day", true) : parseInt(ctx.args[1] ?? "0");
        if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
            await ctx.reply({ embeds: [errorEmbed("Invalid month/day.")] });
            return;
        }
        await BirthdayModel.findOneAndUpdate({ userId: ctx.userId }, { $set: { month, day }, $addToSet: { guildIds: guild.id } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`🎂 Birthday set to **${MONTHS[month - 1]} ${day}**!`)] });
    },
};
export default command;
//# sourceMappingURL=birthdayset.js.map