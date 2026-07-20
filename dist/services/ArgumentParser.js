export class ArgumentParser {
    /**
     * Parse prefix command arguments with smart parsing
     * Supports quoted strings, flags, and type inference
     */
    static parse(input, expectedTypes) {
        const result = {
            args: [],
            flags: new Map(),
            errors: [],
        };
        if (!input.trim())
            return result;
        const tokens = this.tokenize(input);
        let currentArgName = `arg${result.args.length}`;
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            // Handle flags (--flag, -f)
            if (token.startsWith("--")) {
                const flagName = token.slice(2);
                const nextToken = tokens[i + 1];
                if (nextToken && !nextToken.startsWith("-")) {
                    result.flags.set(flagName, nextToken);
                    i++; // Skip next token
                }
                else {
                    result.flags.set(flagName, true);
                }
                continue;
            }
            if (token.startsWith("-") && token.length === 2) {
                const flagName = token.slice(1);
                const nextToken = tokens[i + 1];
                if (nextToken && !nextToken.startsWith("-")) {
                    result.flags.set(flagName, nextToken);
                    i++; // Skip next token
                }
                else {
                    result.flags.set(flagName, true);
                }
                continue;
            }
            // Handle regular arguments
            const argType = expectedTypes?.get(currentArgName) || this.inferType(token);
            result.args.push({
                name: currentArgName,
                value: token,
                type: argType,
            });
            currentArgName = `arg${result.args.length}`;
        }
        return result;
    }
    /**
     * Tokenize input string respecting quoted strings
     */
    static tokenize(input) {
        const tokens = [];
        let current = "";
        let inQuotes = false;
        let quoteChar = "";
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
                continue;
            }
            if (char === quoteChar && inQuotes) {
                inQuotes = false;
                tokens.push(current);
                current = "";
                continue;
            }
            if (char === " " && !inQuotes) {
                if (current) {
                    tokens.push(current);
                    current = "";
                }
                continue;
            }
            current += char;
        }
        if (current) {
            tokens.push(current);
        }
        return tokens;
    }
    /**
     * Infer type from string value
     */
    static inferType(value) {
        if (/^\d+$/.test(value))
            return "integer";
        if (/^\d+\.\d+$/.test(value))
            return "number";
        if (value.toLowerCase() === "true" || value.toLowerCase() === "false")
            return "boolean";
        if (/^<@!?(\d+)>$/.test(value))
            return "user";
        if (/^<@&(\d+)>$/.test(value))
            return "role";
        if (/^<#(\d+)>$/.test(value))
            return "channel";
        return "string";
    }
    /**
     * Get suggestions for incomplete input
     */
    static getSuggestions(input, commands) {
        const lowerInput = input.toLowerCase();
        return commands.filter(cmd => cmd.toLowerCase().startsWith(lowerInput));
    }
    /**
     * Correct misspelled commands using Levenshtein distance
     */
    static correctSpelling(input, commands) {
        const lowerInput = input.toLowerCase();
        const threshold = 3;
        for (const cmd of commands) {
            const distance = this.levenshteinDistance(lowerInput, cmd.toLowerCase());
            if (distance <= threshold) {
                return cmd;
            }
        }
        return null;
    }
    /**
     * Calculate Levenshtein distance between two strings
     */
    static levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[b.length][a.length];
    }
}
//# sourceMappingURL=ArgumentParser.js.map