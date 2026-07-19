import { GuildModel } from "../../database/models/Guild";
const command = {
    name: "faq",
    description: "Add FAQ for AI to answer",
    category: "AI",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b
        .addStringOption((o) => o.setName("question").setDescription("FAQ question").setRequired(true))
        .addStringOption((o) => o.setName("answer").setDescription("FAQ answer").setRequired(true)),
    async execute(ctx) {
        const question = ctx.isSlash ? ctx.interaction.options.getString("question", true) : ctx.args[0];
        const answer = ctx.isSlash ? ctx.interaction.options.getString("answer", true) : ctx.args[1];
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const config = await GuildModel.findOne({ guildId: guild.id });
        const faqs = config?.faqs || [];
        faqs.push({ question, answer });
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { faqs }, { upsert: true });
        await ctx.reply({ content: `✅ FAQ added for "${question}"` });
    },
};
export default command;
//# sourceMappingURL=faq.js.map