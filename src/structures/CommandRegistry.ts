import type { CommandDefinition } from "./types.js";
import { Collection } from "discord.js";

export interface CommandMetadata {
  name: string;
  description: string;
  category: string;
  prefixSupport: boolean;
  slashSupport: boolean;
  aliases: string[];
  permissions: string[];
  botPermissions: string[];
  cooldown: number;
  usage: string;
  examples: string[];
  premiumRequired: boolean;
  guildOnly: boolean;
  ownerOnly: boolean;
  nsfw: boolean;
  autocomplete: boolean;
  options: CommandOption[];
}

export interface CommandOption {
  name: string;
  description: string;
  type: string;
  required: boolean;
  choices?: string[];
  autocomplete?: boolean;
}

export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Collection<string, CommandDefinition> = new Collection();
  private metadata: Map<string, CommandMetadata> = new Map();

  private constructor() {}

  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  register(command: CommandDefinition, metadata: CommandMetadata): void {
    this.commands.set(command.name, command);
    this.metadata.set(command.name, metadata);

    // Register aliases
    for (const alias of metadata.aliases) {
      this.commands.set(alias, command);
    }
  }

  get(name: string): CommandDefinition | undefined {
    return this.commands.get(name);
  }

  getMetadata(name: string): CommandMetadata | undefined {
    return this.metadata.get(name);
  }

  getAll(): Collection<string, CommandDefinition> {
    return this.commands;
  }

  getAllMetadata(): Map<string, CommandMetadata> {
    return this.metadata;
  }

  getByCategory(category: string): Collection<string, CommandDefinition> {
    return this.commands.filter((cmd) => cmd.category === category);
  }

  search(query: string): CommandDefinition[] {
    const results: CommandDefinition[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [name, command] of this.commands) {
      if (name.toLowerCase().includes(lowerQuery) || 
          command.description.toLowerCase().includes(lowerQuery)) {
        results.push(command);
      }
    }

    return results;
  }

  validateParity(): CommandParityReport {
    const report: CommandParityReport = {
      prefixOnly: [],
      slashOnly: [],
      both: [],
      missingPrefix: [],
      missingSlash: [],
      broken: [],
      fixed: [],
      deprecated: [],
    };

    for (const [name, metadata] of this.metadata) {
      if (metadata.prefixSupport && metadata.slashSupport) {
        report.both.push(name);
      } else if (metadata.prefixSupport && !metadata.slashSupport) {
        report.prefixOnly.push(name);
        report.missingSlash.push(name);
      } else if (!metadata.prefixSupport && metadata.slashSupport) {
        report.slashOnly.push(name);
        report.missingPrefix.push(name);
      }
    }

    return report;
  }
}

export interface CommandParityReport {
  prefixOnly: string[];
  slashOnly: string[];
  both: string[];
  missingPrefix: string[];
  missingSlash: string[];
  broken: string[];
  fixed: string[];
  deprecated: string[];
}

export const commandRegistry = CommandRegistry.getInstance();
