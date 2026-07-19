import { BirthdayModel } from "@/database/models/Community";
import { baseEmbed, infoEmbed } from "@/utils/embeds";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const command = {
    name: "birthdaylist",
    description: "List all birthdays in the server",
    category: "Scheduler",
    access: "admin",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const birthdays = await BirthdayModel.find({ guildIds: guild.id }).lean().limit(50);
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
        const embed = baseEmbed("warning")
            .setTitle("🎂 Server Birthdays")
            .setDescription(withNext.slice(0, 25).map((b) => `<@${b.userId}> — **${MONTHS[b.month - 1]} ${b.day}** (<t:${Math.floor(b.nextDate.getTime() / 1000)}:R>)`).join("\n"))
            .setFooter({ text: `${birthdays.length} birthday(s) registered` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=birthdaylist.js.map