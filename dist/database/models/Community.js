import mongoose, { Schema, model } from "mongoose";
const giveawaySchema = new Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    prize: { type: String, required: true },
    winnerCount: { type: Number, default: 1 },
    endsAt: { type: Date, required: true },
    ended: { type: Boolean, default: false },
    paused: { type: Boolean, default: false },
    participants: { type: [String], default: [] },
    winners: { type: [String], default: [] },
    bonusEntryRoleIds: { type: [String], default: [] },
    bonusEntryCounts: { type: Map, of: Number, default: {} }, // roleId -> extraEntries
    requiredRoleId: { type: String, default: null },
    requiredLevel: { type: Number, default: null },
    requiredBalance: { type: Number, default: null },
    blacklistedUsers: { type: [String], default: [] },
}, { timestamps: true });
const suggestionSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true, unique: true },
    authorId: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "denied", "considered"], default: "pending" },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    approvedBy: { type: String, default: null },
    deniedBy: { type: String, default: null },
    staffNote: { type: String, default: null },
}, { timestamps: true });
const serverBackupSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });
const serverTemplateSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });
serverTemplateSchema.index({ guildId: 1, name: 1 }, { unique: true });
const announcementTemplateSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    title: { type: String, default: null },
    description: { type: String, required: true },
    color: { type: String, default: null },
}, { timestamps: true });
announcementTemplateSchema.index({ guildId: 1, name: 1 }, { unique: true });
const savedQueueSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    tracks: { type: [Schema.Types.Mixed], default: [] },
}, { timestamps: true });
savedQueueSchema.index({ guildId: 1, userId: 1, name: 1 }, { unique: true });
// Reaction role config per-guild
const reactionRoleSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    emoji: { type: String, required: true },
    roleId: { type: String, required: true },
}, { timestamps: true });
reactionRoleSchema.index({ guildId: 1, messageId: 1, emoji: 1 }, { unique: true });
// Button role panels (premium)
const buttonRolePanelSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, default: null },
    title: { type: String, default: "Role Selection" },
    description: { type: String, default: "Click a button to get a role." },
    buttons: {
        type: [new Schema({ roleId: String, label: String, emoji: String, style: { type: Number, default: 1 } }, { _id: false })],
        default: [],
    },
}, { timestamps: true });
// Select-role menus (premium)
const selectRolePanelSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, default: null },
    placeholder: { type: String, default: "Select a role..." },
    minValues: { type: Number, default: 0 },
    maxValues: { type: Number, default: 1 },
    options: {
        type: [new Schema({ roleId: String, label: String, description: String, emoji: String }, { _id: false })],
        default: [],
    },
}, { timestamps: true });
// Color role config (premium)
const colorRoleSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, default: null },
    messageId: { type: String, default: null },
    roleIds: { type: [String], default: [] },
}, { timestamps: true });
// Starboard config
const starboardSchema = new Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    channelId: { type: String, required: true },
    threshold: { type: Number, default: 3 },
    enabled: { type: Boolean, default: true },
    starredMessages: { type: [String], default: [] }, // original messageIds already posted
}, { timestamps: true });
// Poll storage
const pollSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true, unique: true },
    authorId: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    votes: { type: Map, of: String, default: {} }, // userId -> optionIndex string
    ended: { type: Boolean, default: false },
    endsAt: { type: Date, default: null },
}, { timestamps: true });
// Temporary role assignments
const tempRoleSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    roleId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    assignedBy: { type: String, required: true },
}, { timestamps: true });
// Server stats voice channel counters (premium)
const serverStatsSchema = new Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    memberCountChannelId: { type: String, default: null },
    botCountChannelId: { type: String, default: null },
    onlineCountChannelId: { type: String, default: null },
    channelCountChannelId: { type: String, default: null },
    roleCountChannelId: { type: String, default: null },
    enabled: { type: Boolean, default: false },
}, { timestamps: true });
// Invite tracking
const inviteTrackingSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    inviterId: { type: String, required: true },
    inviteCode: { type: String, required: true },
    uses: { type: Number, default: 0 },
}, { timestamps: true });
inviteTrackingSchema.index({ guildId: 1, inviteCode: 1 }, { unique: true });
// Birthday registry — one document per user, stores guilds they've set a birthday in
const birthdaySchema = new Schema({
    userId: { type: String, required: true, unique: true, index: true },
    month: { type: Number, required: true }, // 1-12
    day: { type: Number, required: true }, // 1-31
    guildIds: { type: [String], default: [] },
}, { timestamps: true });
birthdaySchema.index({ month: 1, day: 1 });
export const GiveawayModel = (mongoose.models["Giveaway"] ?? model("Giveaway", giveawaySchema));
export const BirthdayModel = (mongoose.models["Birthday"] ?? model("Birthday", birthdaySchema));
export const SuggestionModel = (mongoose.models["Suggestion"] ?? model("Suggestion", suggestionSchema));
export const ServerBackupModel = (mongoose.models["ServerBackup"] ?? model("ServerBackup", serverBackupSchema));
export const ServerTemplateModel = (mongoose.models["ServerTemplate"] ?? model("ServerTemplate", serverTemplateSchema));
export const AnnouncementTemplateModel = (mongoose.models["AnnouncementTemplate"] ?? model("AnnouncementTemplate", announcementTemplateSchema));
export const SavedQueueModel = (mongoose.models["SavedQueue"] ?? model("SavedQueue", savedQueueSchema));
export const ReactionRoleModel = (mongoose.models["ReactionRole"] ?? model("ReactionRole", reactionRoleSchema));
export const ButtonRolePanelModel = (mongoose.models["ButtonRolePanel"] ?? model("ButtonRolePanel", buttonRolePanelSchema));
export const SelectRolePanelModel = (mongoose.models["SelectRolePanel"] ?? model("SelectRolePanel", selectRolePanelSchema));
export const ColorRoleModel = (mongoose.models["ColorRole"] ?? model("ColorRole", colorRoleSchema));
export const StarboardModel = (mongoose.models["Starboard"] ?? model("Starboard", starboardSchema));
export const PollModel = (mongoose.models["Poll"] ?? model("Poll", pollSchema));
export const TempRoleModel = (mongoose.models["TempRole"] ?? model("TempRole", tempRoleSchema));
export const ServerStatsModel = (mongoose.models["ServerStats"] ?? model("ServerStats", serverStatsSchema));
export const InviteTrackingModel = (mongoose.models["InviteTracking"] ?? model("InviteTracking", inviteTrackingSchema));
//# sourceMappingURL=Community.js.map