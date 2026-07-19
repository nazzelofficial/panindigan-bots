import mongoose, { Schema, model } from "mongoose";
const modCaseSchema = new Schema({
    caseId: { type: Number, required: true },
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    type: {
        type: String,
        enum: ["warn", "mute", "unmute", "timeout", "untimeout", "kick", "ban", "tempban", "softban", "unban", "note"],
        required: true,
    },
    reason: { type: String, default: "No reason provided" },
    duration: { type: Number, default: null }, // ms
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
    editedReason: { type: String, default: null },
}, { timestamps: true });
modCaseSchema.index({ guildId: 1, caseId: 1 }, { unique: true });
const staffNoteSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    note: { type: String, required: true },
}, { timestamps: true });
const globalBanSchema = new Schema({
    userId: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: "No reason provided" },
    moderatorId: { type: String, required: true },
}, { timestamps: true });
const blacklistSchema = new Schema({
    entityId: { type: String, required: true, index: true },
    entityType: { type: String, enum: ["user", "server"], required: true },
    reason: { type: String, default: "No reason provided" },
    moderatorId: { type: String, required: true },
}, { timestamps: true });
blacklistSchema.index({ entityId: 1, entityType: 1 }, { unique: true });
const antiNukeIncidentSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    count: { type: Number, required: true },
    punishment: { type: String, required: true },
}, { timestamps: true });
const appealTicketSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    caseId: { type: Number, default: null },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
    reviewedBy: { type: String, default: null },
    reviewReason: { type: String, default: null },
}, { timestamps: true });
const warningTemplateSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    reason: { type: String, required: true },
}, { timestamps: true });
warningTemplateSchema.index({ guildId: 1, name: 1 }, { unique: true });
export const ModCaseModel = (mongoose.models["ModCase"] ?? model("ModCase", modCaseSchema));
export const StaffNoteModel = (mongoose.models["StaffNote"] ?? model("StaffNote", staffNoteSchema));
export const GlobalBanModel = (mongoose.models["GlobalBan"] ?? model("GlobalBan", globalBanSchema));
export const BlacklistModel = (mongoose.models["Blacklist"] ?? model("Blacklist", blacklistSchema));
export const AntiNukeIncidentModel = (mongoose.models["AntiNukeIncident"] ?? model("AntiNukeIncident", antiNukeIncidentSchema));
export const AppealTicketModel = (mongoose.models["AppealTicket"] ?? model("AppealTicket", appealTicketSchema));
export const WarningTemplateModel = (mongoose.models["WarningTemplate"] ?? model("WarningTemplate", warningTemplateSchema));
//# sourceMappingURL=Moderation.js.map