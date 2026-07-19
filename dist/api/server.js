import express from "express";
import { ApiKeyModel } from "../database/models/System";
import { GuildModel } from "../database/models/Guild";
import { getGuildTier } from "../utils/premium";
import { scopedLogger } from "../utils/logger";
const log = scopedLogger("api");
/**
 * Minimal REST API surface for Enterprise-tier "integrate the bot with your
 * own website" access (`apikey generate`, `REST API access`). Every route is
 * gated behind a valid, non-revoked API key tied to a specific guild.
 */
export function startApiServer(client) {
    if (!client.config.api?.enabled)
        return;
    const app = express();
    app.use(express.json());
    app.use(async (req, res, next) => {
        const key = req.header("x-api-key");
        if (!key)
            return res.status(401).json({ error: "Missing X-API-Key header" });
        const record = await ApiKeyModel.findOne({ key, revoked: false });
        if (!record)
            return res.status(403).json({ error: "Invalid or revoked API key" });
        record.lastUsedAt = new Date();
        await record.save();
        req.apiGuildId = record.guildId;
        next();
    });
    app.get("/v1/guild", async (req, res) => {
        const guildId = req.apiGuildId;
        const guild = client.guilds.cache.get(guildId);
        if (!guild)
            return res.status(404).json({ error: "Bot is not in that guild" });
        const config = await GuildModel.findOne({ guildId }).lean();
        const tier = await getGuildTier(guildId);
        res.json({
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            premiumTier: tier,
            prefix: config?.prefix ?? client.config.bot.defaultPrefix,
        });
    });
    app.get("/v1/guild/stats", async (req, res) => {
        const guildId = req.apiGuildId;
        const guild = client.guilds.cache.get(guildId);
        if (!guild)
            return res.status(404).json({ error: "Bot is not in that guild" });
        res.json({
            members: guild.memberCount,
            channels: guild.channels.cache.size,
            roles: guild.roles.cache.size,
            boostLevel: guild.premiumTier,
        });
    });
    const port = Number(process.env.API_PORT ?? 3001);
    app.listen(port, () => log.info(`REST API listening on port ${port}`));
}
//# sourceMappingURL=server.js.map