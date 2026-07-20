/**
 * Select menu builder helpers.
 * Factory functions for every SelectMenu variant with consistent defaults.
 *
 * Component ID scheme: <category>:<action>:<targetId>:v1
 */
import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, MentionableSelectMenuBuilder, } from "discord.js";
/** Build a StringSelectMenu with sensible defaults. */
export function stringSelect(customId, placeholder, options, opts = {}) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .setMinValues(opts.minValues ?? 1)
        .setMaxValues(opts.maxValues ?? 1);
    if (opts.disabled)
        menu.setDisabled(true);
    for (const o of options) {
        const opt = new StringSelectMenuOptionBuilder()
            .setLabel(o.label)
            .setValue(o.value);
        if (o.description)
            opt.setDescription(o.description);
        if (o.emoji)
            opt.setEmoji(o.emoji);
        if (o.default)
            opt.setDefault(true);
        menu.addOptions(opt);
    }
    return menu;
}
/** Build a UserSelectMenu. */
export function userSelect(customId, placeholder = "Select a user…", opts = {}) {
    const menu = new UserSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .setMinValues(opts.minValues ?? 1)
        .setMaxValues(opts.maxValues ?? 1);
    if (opts.disabled)
        menu.setDisabled(true);
    return menu;
}
/** Build a RoleSelectMenu. */
export function roleSelect(customId, placeholder = "Select a role…", opts = {}) {
    const menu = new RoleSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .setMinValues(opts.minValues ?? 1)
        .setMaxValues(opts.maxValues ?? 1);
    if (opts.disabled)
        menu.setDisabled(true);
    return menu;
}
/** Build a ChannelSelectMenu optionally filtered to specific channel types. */
export function channelSelect(customId, placeholder = "Select a channel…", channelTypes, opts = {}) {
    const menu = new ChannelSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .setMinValues(opts.minValues ?? 1)
        .setMaxValues(opts.maxValues ?? 1);
    if (channelTypes?.length)
        menu.addChannelTypes(...channelTypes);
    if (opts.disabled)
        menu.setDisabled(true);
    return menu;
}
/** Build a MentionableSelectMenu (users + roles). */
export function mentionableSelect(customId, placeholder = "Select a user or role…", opts = {}) {
    const menu = new MentionableSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .setMinValues(opts.minValues ?? 1)
        .setMaxValues(opts.maxValues ?? 1);
    if (opts.disabled)
        menu.setDisabled(true);
    return menu;
}
//# sourceMappingURL=select.js.map