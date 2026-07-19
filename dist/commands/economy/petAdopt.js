import { UserModel } from "../../database/models/User";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "pet_adopt",
    description: "Adopt a pet",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("pet")
        .setDescription("Pet type")
        .setRequired(true)
        .addChoices({ name: "🐕 Dog", value: "dog" }, { name: "🐈 Cat", value: "cat" }, { name: "🐰 Rabbit", value: "rabbit" }, { name: "🦊 Fox", value: "fox" }, { name: "🐺 Wolf", value: "wolf" })),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const pet = ctx.isSlash ? ctx.interaction.options.getString("pet", true) : ctx.args[0]?.toLowerCase();
        if (!pet)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        if (profile.pet) {
            return ctx.reply({ embeds: [errorEmbed("❌ You already have a pet")] });
        }
        const cost = 5000;
        if (profile.balance < cost) {
            return ctx.reply({ embeds: [errorEmbed(`❌ You need ${cost} coins to adopt a pet`)] });
        }
        profile.balance = (profile.balance ?? 0) - cost;
        profile.pet = pet;
        profile.petHappiness = 100;
        profile.petHunger = 0;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ You adopted a ${pet}!`)] });
    },
};
export default command;
//# sourceMappingURL=petAdopt.js.map