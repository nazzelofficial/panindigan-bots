import { BirthdayModel } from "../../database/models/Community.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const command = {
    name: "birthdayview",
    description: "View your birthday",
    category: "Scheduler",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addUserOption((o) => o.setName("user").setDescription("User (default: you)").setRequired(false)),
    async execute(ctx) {
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
    },
};
export default command;
//# sourceMappingURL=birthdayview.js.map