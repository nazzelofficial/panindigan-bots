import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "birthdaymessage",
    description: "Set the birthday message",
    category: "Scheduler",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("message").setDescription("Birthday message (use {user} for mention)").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const message = ctx.isSlash ? ctx.interaction.options.getString("message", true) : ctx.args.join(" ");
        if (!message) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a message.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { birthdayMessage: message } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Birthday message set.")] });
    },
};
export default command;
//# sourceMappingURL=birthdaymessage.js.map