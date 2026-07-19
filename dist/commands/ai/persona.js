import { baseEmbed, successEmbed, errorEmbed } from "../../utils/embeds";
import { GuildModel } from "../../database/models/Guild";
const command = {
    name: "persona",
    description: "Set or view the AI persona for this server",
    category: "AI",
    access: "admin",
    guildOnly: true,
    cooldown: 10,
    aliases: ["aipersona", "setpersona"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("set")
        .setDescription("Set a custom AI persona for this server")
        .addStringOption((o) => o.setName("name").setDescription("Persona name").setRequired(true).setMaxLength(50))
        .addStringOption((o) => o.setName("description").setDescription("Persona description / system prompt").setRequired(true).setMaxLength(500)))
        .addSubcommand((s) => s.setName("view").setDescription("View the current AI persona"))
        .addSubcommand((s) => s.setName("reset").setDescription("Reset to default AI persona")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0] ?? "view");
        if (sub === "view") {
            const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
            const persona = doc?.aiPersona;
            if (!persona) {
                await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🤖 AI Persona").setDescription("No custom persona set. Using default Panindigan AI.")] });
            }
            else {
                await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🤖 AI Persona").addFields({ name: "Name", value: persona.name ?? "Custom" }, { name: "Description", value: persona.description ?? "No description" })] });
            }
        }
        else if (sub === "set") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            const description = ctx.isSlash ? ctx.interaction.options.getString("description", true) : ctx.args.slice(2).join(" ");
            if (!name || !description) {
                await ctx.reply({ embeds: [errorEmbed("Please provide both a name and description.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { aiPersona: { name, description } } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`🤖 AI persona set to **${name}**.`)] });
        }
        else if (sub === "reset") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { aiPersona: 1 } });
            await ctx.reply({ embeds: [successEmbed("🤖 AI persona reset to default.")] });
        }
    },
};
export default command;
//# sourceMappingURL=persona.js.map