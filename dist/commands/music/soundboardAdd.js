import { successEmbed, errorEmbed } from "../../utils/embeds";
import { GuildModel } from "../../database/models/Guild";
const command = {
    name: "soundboardadd",
    description: "Add a sound to the server soundboard",
    category: "Music",
    access: "admin",
    guildOnly: true,
    cooldown: 5,
    aliases: ["addsound"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("name").setDescription("Name for the sound").setRequired(true).setMaxLength(32))
        .addStringOption((o) => o.setName("url").setDescription("Direct audio URL (mp3/wav/ogg)").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const name = (ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[0]) ?? "";
        const url = (ctx.isSlash ? ctx.interaction.options.getString("url", true) : ctx.args[1]) ?? "";
        if (!name || !url) {
            await ctx.reply({ embeds: [errorEmbed("Please provide both a name and a URL.")] });
            return;
        }
        const doc = await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { "soundboard": { name: name.toLowerCase(), url, addedBy: ctx.userId } } }, { new: true, upsert: true });
        await ctx.reply({ embeds: [successEmbed(`🔊 Added sound **"${name}"** to the soundboard.`)] });
    },
};
export default command;
//# sourceMappingURL=soundboardAdd.js.map