import { BirthdayModel } from "../../database/models/Community";
import { successEmbed } from "../../utils/embeds";
const command = {
    name: "birthdayremove",
    description: "Remove your birthday",
    category: "Scheduler",
    access: "general",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await BirthdayModel.findOneAndUpdate({ userId: ctx.userId }, { $pull: { guildIds: guild.id } });
        await ctx.reply({ embeds: [successEmbed("Birthday removed from this server.")] });
    },
};
export default command;
//# sourceMappingURL=birthdayremove.js.map