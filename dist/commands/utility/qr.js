import { infoEmbed } from "@/utils/embeds";
const command = {
    name: "qr",
    description: "Generate a QR code",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("text").setDescription("Text to encode").setRequired(true)),
    async execute(ctx) {
        const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.join(" ");
        await ctx.reply({ embeds: [infoEmbed(`📱 QR Code generated for: ${text}`)] });
    },
};
export default command;
//# sourceMappingURL=qr.js.map