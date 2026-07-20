import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { requireEnv } from "./config/config.js";
import { scopedLogger } from "./utils/logger.js";
import type { CommandDefinition } from "./structures/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const _require   = createRequire(import.meta.url);
const log        = scopedLogger("deploy");

/** Recursively truncate every `name` and `description` field in a raw Discord command object. */
function sanitize(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "name"        && typeof v === "string") { out[k] = v.slice(0, 32);  continue; }
      if (k === "description" && typeof v === "string") { out[k] = v.slice(0, 100); continue; }
      out[k] = sanitize(v);
    }
    return out;
  }
  return obj;
}

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

async function main() {
  const commandsDir = path.join(__dirname, "commands");
  const files       = walk(commandsDir);
  const body: any[] = [];
  const seen        = new Set<string>();

  for (const file of files) {
    try {
      const mod = _require(file);
      const command: CommandDefinition | undefined = mod.default ?? mod.command;
      if (!command?.name || typeof command.execute !== "function") continue;
      if (seen.has(command.name)) continue;
      seen.add(command.name);

      let builder = new SlashCommandBuilder()
        .setName(command.name.slice(0, 32))
        .setDescription((command.description ?? "No description").slice(0, 100));

      if (command.slashData) {
        try { builder = command.slashData(builder) as SlashCommandBuilder; }
        catch { /* skip malformed slashData */ }
      }

      body.push(sanitize(builder.toJSON()));

      // Discord allows a maximum of 100 global slash commands
      if (body.length >= 100) break;
    } catch (err: any) {
      log.warn(`Skipping command file (load error): ${path.basename(file)}`, { error: err.message });
    }
  }

  const token    = requireEnv("DISCORD_TOKEN");
  const clientId = requireEnv("DISCORD_CLIENT_ID");
  const rest     = new REST({ version: "10" }).setToken(token);

  log.info(`Registering ${body.length} global slash commands...`);
  await rest.put(Routes.applicationCommands(clientId), { body });
  log.info(`✅ Successfully registered ${body.length} slash commands globally. They may take up to 1 hour to propagate.`);
}

main().catch((err) => {
  log.error("Failed to deploy slash commands", { error: err.message, stack: err.stack });
  process.exit(1);
});
