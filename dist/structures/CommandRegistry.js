import { Collection } from "discord.js";
export class CommandRegistry {
    static instance;
    commands = new Collection();
    metadata = new Map();
    constructor() { }
    static getInstance() {
        if (!CommandRegistry.instance) {
            CommandRegistry.instance = new CommandRegistry();
        }
        return CommandRegistry.instance;
    }
    register(command, metadata) {
        this.commands.set(command.name, command);
        this.metadata.set(command.name, metadata);
        // Register aliases
        for (const alias of metadata.aliases) {
            this.commands.set(alias, command);
        }
    }
    get(name) {
        return this.commands.get(name);
    }
    getMetadata(name) {
        return this.metadata.get(name);
    }
    getAll() {
        return this.commands;
    }
    getAllMetadata() {
        return this.metadata;
    }
    getByCategory(category) {
        return this.commands.filter((cmd) => cmd.category === category);
    }
    search(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        for (const [name, command] of this.commands) {
            if (name.toLowerCase().includes(lowerQuery) ||
                command.description.toLowerCase().includes(lowerQuery)) {
                results.push(command);
            }
        }
        return results;
    }
    validateParity() {
        const report = {
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
            }
            else if (metadata.prefixSupport && !metadata.slashSupport) {
                report.prefixOnly.push(name);
                report.missingSlash.push(name);
            }
            else if (!metadata.prefixSupport && metadata.slashSupport) {
                report.slashOnly.push(name);
                report.missingPrefix.push(name);
            }
        }
        return report;
    }
}
export const commandRegistry = CommandRegistry.getInstance();
//# sourceMappingURL=CommandRegistry.js.map