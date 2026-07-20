import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { baseEmbed, errorEmbed, successEmbed, infoEmbed, warnEmbed } from "../../utils/embeds.js";
import { MaintenanceStateModel, FeatureFlagModel } from "../../database/models/System.js";
import { GuildModel } from "../../database/models/Guild.js";
import { validateEnv } from "../../config/config.js";
import os from "node:os";
const LOG_DIR = path.resolve(process.cwd(), "logs");
const command = {
    name: "botmanage",
    description: "Bot management: restart, shutdown, maintenance, botstats, memory, cpu, changelog, featureflag, envcheck, systemlogs, debug, reload",
    category: "Owner",
    access: "owner",
    guildOnly: false,
    cooldown: 3,
    aliases: ["bm"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("restart").setDescription("Restart the bot process"))
        .addSubcommand((s) => s.setName("shutdown").setDescription("Gracefully shut down the bot"))
        .addSubcommand((s) => s.setName("update").setDescription("git pull and exit (process manager restarts)"))
        .addSubcommand((s) => s
        .setName("maintenance")
        .setDescription("Toggle maintenance mode")
        .addStringOption((o) => o
        .setName("action")
        .setDescription("on/off/message")
        .setRequired(true)
        .addChoices({ name: "on", value: "on" }, { name: "off", value: "off" }, { name: "message", value: "message" }))
        .addStringOption((o) => o.setName("text").setDescription("Reason or message").setRequired(false)))
        .addSubcommand((s) => s
        .setName("changelog")
        .setDescription("Broadcast a changelog embed to all guilds' system channel")
        .addStringOption((o) => o.setName("message").setDescription("Changelog message").setRequired(true)))
        .addSubcommand((s) => s.setName("botstats").setDescription("Show detailed bot statistics"))
        .addSubcommand((s) => s.setName("memory").setDescription("Show memory usage"))
        .addSubcommand((s) => s.setName("cpu").setDescription("Show CPU info"))
        .addSubcommand((s) => s.setName("envcheck").setDescription("Check environment variables"))
        .addSubcommand((s) => s
        .setName("featureflag")
        .setDescription("Feature flag management")
        .addStringOption((o) => o
        .setName("action")
        .setDescription("list/toggle")
        .setRequired(true)
        .addChoices({ name: "list", value: "list" }, { name: "toggle", value: "toggle" }))
        .addStringOption((o) => o.setName("name").setDescription("Flag name").setRequired(false)))
        .addSubcommand((s) => s
        .setName("systemlogs")
        .setDescription("View, clear, or download system logs")
        .addStringOption((o) => o
        .setName("action")
        .setDescription("view/clear/download")
        .setRequired(true)
        .addChoices({ name: "view", value: "view" }, { name: "clear", value: "clear" }, { name: "download", value: "download" })))
        .addSubcommand((s) => s
        .setName("debug")
        .setDescription("Toggle debug mode for a module")
        .addStringOption((o) => o.setName("module").setDescription("Module name or 'off'").setRequired(true)))
        .addSubcommand((s) => s
        .setName("reload")
        .setDescription("Reload a command by name")
        .addStringOption((o) => o.setName("command").setDescription("Command name to reload").setRequired(true)))
        .addSubcommand((s) => s.setName("reloadall").setDescription("Reload all commands (marks for next restart)")),
    async execute(ctx) {
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        // --- RESTART ---
        if (sub === "restart") {
            await ctx.reply({ embeds: [warnEmbed("Restarting bot process...")] });
            setTimeout(() => process.exit(0), 1000);
            return;
        }
        // --- SHUTDOWN ---
        if (sub === "shutdown") {
            await ctx.reply({ embeds: [warnEmbed("Shutting down bot...")] });
            setTimeout(() => process.exit(0), 1000);
            return;
        }
        // --- UPDATE ---
        if (sub === "update") {
            try {
                const result = execSync("git pull", { encoding: "utf-8", timeout: 30000 });
                await ctx.reply({ embeds: [successEmbed(`Git pull complete:\n\`\`\`\n${result.slice(0, 1500)}\n\`\`\`\nRestarting...`)] });
                setTimeout(() => process.exit(0), 2000);
            }
            catch (e) {
                await ctx.reply({ embeds: [errorEmbed(`git pull failed:\n\`\`\`\n${String(e.message).slice(0, 1500)}\n\`\`\``)] });
            }
            return;
        }
        // --- MAINTENANCE ---
        if (sub === "maintenance") {
            const action = ctx.isSlash ? ctx.interaction.options.getString("action", true) : ctx.args[1]?.toLowerCase();
            const text = ctx.isSlash ? ctx.interaction.options.getString("text") ?? "" : ctx.args.slice(2).join(" ");
            if (!action) {
                await ctx.reply({ embeds: [errorEmbed("Provide an action: on / off / message")] });
                return;
            }
            if (action === "on") {
                await MaintenanceStateModel.findOneAndUpdate({ key: "singleton" }, { $set: { enabled: true, reason: text || "Maintenance in progress" } }, { upsert: true });
                await ctx.reply({ embeds: [warnEmbed(`🔧 Maintenance mode **ON**. Reason: ${text || "Maintenance in progress"}`)] });
            }
            else if (action === "off") {
                await MaintenanceStateModel.findOneAndUpdate({ key: "singleton" }, { $set: { enabled: false, reason: null, message: null } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed("🔧 Maintenance mode **OFF**. Bot is back online.")] });
            }
            else if (action === "message") {
                await MaintenanceStateModel.findOneAndUpdate({ key: "singleton" }, { $set: { message: text || null } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed(`Maintenance message set: ${text || "(cleared)"}`)] });
            }
            else {
                await ctx.reply({ embeds: [errorEmbed("Unknown action. Use: on / off / message")] });
            }
            return;
        }
        // --- CHANGELOG ---
        if (sub === "changelog") {
            const message = ctx.isSlash ? ctx.interaction.options.getString("message", true) : ctx.args.slice(1).join(" ");
            if (!message) {
                await ctx.reply({ embeds: [errorEmbed("Provide a changelog message.")] });
                return;
            }
            const guilds = await GuildModel.find({}).lean();
            let sent = 0;
            const changelogEmbed = baseEmbed("primary")
                .setTitle("📋 Changelog")
                .setDescription(message)
                .setFooter({ text: "Panindigan Official" });
            for (const g of guilds) {
                try {
                    const guild = ctx.client.guilds.cache.get(g.guildId);
                    if (!guild)
                        continue;
                    const systemChannel = guild.systemChannel;
                    if (systemChannel?.isTextBased()) {
                        await systemChannel.send({ embeds: [changelogEmbed] });
                        sent++;
                    }
                }
                catch {
                    // skip
                }
            }
            await ctx.reply({ embeds: [successEmbed(`Changelog broadcast to **${sent}** guild(s).`)] });
            return;
        }
        // --- BOTSTATS ---
        if (sub === "botstats") {
            const client = ctx.client;
            const guilds = client.guilds.cache.size;
            const users = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
            const channels = client.channels.cache.size;
            const uptime = Math.floor((Date.now() - client.startedAt) / 1000);
            const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = uptime % 60;
            const mem = process.memoryUsage();
            const embed = baseEmbed("primary")
                .setTitle("📊 Bot Statistics")
                .addFields({ name: "Guilds", value: `${guilds}`, inline: true }, { name: "Users", value: `${users}`, inline: true }, { name: "Channels", value: `${channels}`, inline: true }, { name: "Commands", value: `${client.commands.size}`, inline: true }, { name: "WS Ping", value: `${client.ws.ping}ms`, inline: true }, { name: "Uptime", value: `${h}h ${m}m ${s}s`, inline: true }, { name: "Heap Used", value: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true }, { name: "RSS", value: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`, inline: true }, { name: "Node.js", value: process.version, inline: true });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        // --- MEMORY ---
        if (sub === "memory") {
            const mem = process.memoryUsage();
            const total = os.totalmem();
            const free = os.freemem();
            const embed = baseEmbed("info")
                .setTitle("💾 Memory Usage")
                .addFields({ name: "Heap Used", value: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }, { name: "Heap Total", value: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`, inline: true }, { name: "RSS", value: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`, inline: true }, { name: "External", value: `${(mem.external / 1024 / 1024).toFixed(2)} MB`, inline: true }, { name: "System Free", value: `${(free / 1024 / 1024 / 1024).toFixed(2)} GB`, inline: true }, { name: "System Total", value: `${(total / 1024 / 1024 / 1024).toFixed(2)} GB`, inline: true });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        // --- CPU ---
        if (sub === "cpu") {
            const cpus = os.cpus();
            const model = cpus[0]?.model ?? "Unknown";
            const cores = cpus.length;
            const load = os.loadavg();
            const embed = baseEmbed("info")
                .setTitle("🖥️ CPU Info")
                .addFields({ name: "Model", value: model, inline: false }, { name: "Cores", value: `${cores}`, inline: true }, { name: "Load Avg (1m)", value: `${load[0]?.toFixed(2)}`, inline: true }, { name: "Load Avg (5m)", value: `${load[1]?.toFixed(2)}`, inline: true }, { name: "Platform", value: os.platform(), inline: true }, { name: "Architecture", value: os.arch(), inline: true });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        // --- ENVCHECK ---
        if (sub === "envcheck") {
            const { missing, optionalMissing } = validateEnv();
            const embed = baseEmbed(missing.length > 0 ? "danger" : "success")
                .setTitle("🔐 Environment Variable Check")
                .addFields({
                name: "❌ Missing Required",
                value: missing.length ? missing.map((e) => `\`${e.key}\` — ${e.description}`).join("\n") : "None",
            }, {
                name: "⚠️ Missing Optional",
                value: optionalMissing.length
                    ? optionalMissing.map((e) => `\`${e.key}\` — ${e.description}`).join("\n")
                    : "None",
            });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        // --- FEATUREFLAG ---
        if (sub === "featureflag") {
            const action = ctx.isSlash ? ctx.interaction.options.getString("action", true) : ctx.args[1]?.toLowerCase();
            const flagName = ctx.isSlash ? ctx.interaction.options.getString("name") : ctx.args[2];
            if (action === "list") {
                const flags = await FeatureFlagModel.find({}).lean();
                if (!flags.length) {
                    await ctx.reply({ embeds: [infoEmbed("No feature flags defined.")] });
                    return;
                }
                const embed = baseEmbed("primary")
                    .setTitle("🚩 Feature Flags")
                    .setDescription(flags.map((f) => `**${f.name}**: ${f.enabled ? "✅" : "❌"} — ${f.description || "no description"}`).join("\n"));
                await ctx.reply({ embeds: [embed] });
            }
            else if (action === "toggle") {
                if (!flagName) {
                    await ctx.reply({ embeds: [errorEmbed("Provide a flag name to toggle.")] });
                    return;
                }
                const flag = await FeatureFlagModel.findOne({ name: flagName });
                if (!flag) {
                    // create it enabled
                    await FeatureFlagModel.create({ name: flagName, enabled: true, description: "" });
                    await ctx.reply({ embeds: [successEmbed(`Feature flag \`${flagName}\` created and **enabled**.`)] });
                }
                else {
                    flag.enabled = !flag.enabled;
                    await flag.save();
                    await ctx.reply({ embeds: [successEmbed(`Feature flag \`${flagName}\` is now **${flag.enabled ? "enabled" : "disabled"}**.`)] });
                }
            }
            else {
                await ctx.reply({ embeds: [errorEmbed("Unknown action. Use: list / toggle [name]")] });
            }
            return;
        }
        // --- SYSTEMLOGS ---
        if (sub === "systemlogs") {
            const action = ctx.isSlash ? ctx.interaction.options.getString("action", true) : ctx.args[1]?.toLowerCase();
            if (action === "view") {
                const files = fs.existsSync(LOG_DIR) ? fs.readdirSync(LOG_DIR).filter((f) => f.endsWith(".log")).slice(0, 10) : [];
                if (!files.length) {
                    await ctx.reply({ embeds: [infoEmbed("No log files found.")] });
                    return;
                }
                // Read the latest log file's last 50 lines
                const latest = files.sort().reverse()[0];
                const content = fs.readFileSync(path.join(LOG_DIR, latest), "utf-8");
                const lines = content.split("\n").filter(Boolean).slice(-40).join("\n").slice(0, 3800);
                const embed = baseEmbed("primary")
                    .setTitle(`📄 System Logs — ${latest}`)
                    .setDescription(`\`\`\`\n${lines}\n\`\`\``);
                await ctx.reply({ embeds: [embed] });
            }
            else if (action === "clear") {
                if (fs.existsSync(LOG_DIR)) {
                    const files = fs.readdirSync(LOG_DIR).filter((f) => f.endsWith(".log") || f.endsWith(".gz"));
                    for (const f of files)
                        fs.unlinkSync(path.join(LOG_DIR, f));
                    await ctx.reply({ embeds: [successEmbed(`Cleared **${files.length}** log file(s).`)] });
                }
                else {
                    await ctx.reply({ embeds: [infoEmbed("Log directory does not exist.")] });
                }
            }
            else if (action === "download") {
                if (!fs.existsSync(LOG_DIR)) {
                    await ctx.reply({ embeds: [errorEmbed("Log directory does not exist.")] });
                    return;
                }
                const files = fs.readdirSync(LOG_DIR).filter((f) => f.endsWith(".log")).sort().reverse();
                if (!files.length) {
                    await ctx.reply({ embeds: [infoEmbed("No log files to download.")] });
                    return;
                }
                const latest = files[0];
                const buf = fs.readFileSync(path.join(LOG_DIR, latest));
                const guild = ctx.interaction?.guild ?? ctx.message?.guild;
                const channel = ctx.interaction?.channel ?? ctx.message?.channel;
                if (channel?.isTextBased?.()) {
                    await channel.send({ files: [{ attachment: buf, name: latest }] });
                    await ctx.reply({ embeds: [successEmbed(`Sent log file: \`${latest}\``)] });
                }
            }
            else {
                await ctx.reply({ embeds: [errorEmbed("Unknown action. Use: view / clear / download")] });
            }
            return;
        }
        // --- DEBUG ---
        if (sub === "debug") {
            const moduleName = ctx.isSlash ? ctx.interaction.options.getString("module", true) : ctx.args[1];
            if (!moduleName) {
                await ctx.reply({ embeds: [errorEmbed("Provide a module name or 'off'.")] });
                return;
            }
            if (moduleName === "off") {
                process.env.LOG_LEVEL = "info";
                await ctx.reply({ embeds: [successEmbed("Debug mode disabled. Log level restored to `info`.")] });
            }
            else {
                process.env.LOG_LEVEL = "debug";
                await ctx.reply({ embeds: [warnEmbed(`Debug mode **ON** for module \`${moduleName}\`. Log level set to \`debug\`. Use \`debug off\` to disable.`)] });
            }
            return;
        }
        // --- RELOAD ---
        if (sub === "reload") {
            const cmdName = ctx.isSlash ? ctx.interaction.options.getString("command", true) : ctx.args[1];
            if (!cmdName) {
                await ctx.reply({ embeds: [errorEmbed("Provide a command name to reload.")] });
                return;
            }
            const existing = ctx.client.commands.get(cmdName);
            if (!existing) {
                await ctx.reply({ embeds: [errorEmbed(`Command \`${cmdName}\` not found.`)] });
                return;
            }
            await ctx.reply({ embeds: [infoEmbed(`Hot-reload of individual commands requires a restart to take full effect (ESM module cache). Use \`botmanage restart\` after editing.`)] });
            return;
        }
        // --- RELOADALL ---
        if (sub === "reloadall") {
            await ctx.reply({ embeds: [infoEmbed("All commands will be re-registered on next restart. Use `botmanage restart` to apply.")] });
            return;
        }
        await ctx.reply({
            embeds: [
                errorEmbed("Unknown subcommand. Use: restart | shutdown | update | maintenance | changelog | botstats | memory | cpu | envcheck | featureflag | systemlogs | debug | reload | reloadall"),
            ],
        });
    },
};
export default command;
//# sourceMappingURL=botmanage.js.map