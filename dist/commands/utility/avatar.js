import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "avatar",
    description: "Get a user's avatar in full resolution",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 5,
    aliases: ["av", "pfp", "icon"],
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User (default: you)").setRequired(false))
        .addStringOption((o) => o.setName("type").setDescription("Avatar type").setRequired(false)
        .addChoices({ name: "global", value: "global" }, { name: "server", value: "server" })),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        const target = ctx.isSlash
            ? ctx.interaction.options.getUser("user") ?? ctx.interaction.user
            : ctx.args[0]
                ? await ctx.client.users.fetch(ctx.args[0].replace(/\D/g, "")).catch(() => null)
                : await ctx.client.users.fetch(ctx.userId);
        if (!target) {
            await ctx.reply({ embeds: [errorEmbed("User not found.")] });
            return;
        }
        const type = ctx.isSlash ? ctx.interaction.options.getString("type") ?? "global" : "global";
        const formats = ["png", "jpg", "webp", "gif"];
        let avatarUrl = null;
        if (type === "server" && guild) {
            const member = await guild.members.fetch(target.id).catch(() => null);
            avatarUrl = member?.displayAvatarURL({ size: 4096 }) ?? target.displayAvatarURL({ size: 4096 });
        }
        else {
            avatarUrl = target.displayAvatarURL({ size: 4096 });
        }
        const links = formats
            .map((f) => `[${f.toUpperCase()}](${target.displayAvatarURL({ extension: f, size: 4096 })})`)
            .join(" · ");
        const embed = baseEmbed("primary")
            .setTitle(`🖼️ ${target.username}'s Avatar`)
            .setDescription(links)
            .setImage(avatarUrl);
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=avatar.js.map