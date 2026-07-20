import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "eventdelete",
    description: "Delete an event",
    category: "Scheduler",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("id").setDescription("Event ID").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const id = ctx.isSlash ? ctx.interaction.options.getString("id", true) : ctx.args[0];
        if (!id) {
            await ctx.reply({ embeds: [errorEmbed("Please provide an event ID.")] });
            return;
        }
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const events = cfg?.events ?? [];
        const index = events.findIndex((e) => e.id === id);
        if (index === -1) {
            await ctx.reply({ embeds: [errorEmbed("Event not found.")] });
            return;
        }
        events.splice(index, 1);
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { events } });
        await ctx.reply({ embeds: [successEmbed("Event deleted.")] });
    },
};
export default command;
//# sourceMappingURL=eventdelete.js.map