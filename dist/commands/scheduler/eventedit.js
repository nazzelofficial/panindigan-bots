import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "eventedit",
    description: "Edit an event",
    category: "Scheduler",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b
        .addStringOption((o) => o.setName("id").setDescription("Event ID").setRequired(true))
        .addStringOption((o) => o.setName("date").setDescription("New date (YYYY-MM-DD)").setRequired(false))
        .addStringOption((o) => o.setName("description").setDescription("New description").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const id = ctx.isSlash ? ctx.interaction.options.getString("id", true) : ctx.args[0];
        const date = ctx.isSlash ? ctx.interaction.options.getString("date") : ctx.args[1];
        const description = ctx.isSlash ? ctx.interaction.options.getString("description") : ctx.args.slice(2).join(" ");
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
        if (date) {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                await ctx.reply({ embeds: [errorEmbed("Invalid date format. Use YYYY-MM-DD.")] });
                return;
            }
            events[index].date = parsedDate;
        }
        if (description !== undefined) {
            events[index].description = description;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { events } });
        await ctx.reply({ embeds: [successEmbed("Event updated.")] });
    },
};
export default command;
//# sourceMappingURL=eventedit.js.map