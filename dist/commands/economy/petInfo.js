import { UserModel } from "@/database/models/User";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "pet_info",
    description: "View your pet information",
    category: "Economy",
    access: "general",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        if (!profile.pet) {
            return ctx.reply({ embeds: [errorEmbed("❌ You do not have a pet")] });
        }
        const petEmojis = {
            dog: "🐕",
            cat: "🐈",
            rabbit: "🐰",
            fox: "🦊",
            wolf: "🐺",
        };
        const embed = baseEmbed("primary")
            .setTitle("🐾 Pet Information")
            .addFields({ name: "Pet", value: `${petEmojis[profile.pet] || "🐾"} ${profile.pet}`, inline: true }, { name: "Happiness", value: `${profile.petHappiness || 100}%`, inline: true }, { name: "Hunger", value: `${profile.petHunger || 0}%`, inline: true });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=petInfo.js.map