import { successEmbed } from "../../utils/embeds";
import { scopedLogger } from "../../utils/logger";
const log = scopedLogger("owner:restart");
const command = {
    name: "restart",
    description: "Restart the bot process",
    category: "Owner",
    access: "owner",
    guildOnly: false,
    cooldown: 30,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [successEmbed("🔄 Restarting bot...")] });
        const user = ctx.isSlash ? ctx.interaction.user.tag : ctx.message.author.tag;
        log.info(`Bot restart triggered by ${user}`);
        setTimeout(() => process.exit(0), 1000);
    },
};
export default command;
//# sourceMappingURL=restart.js.map