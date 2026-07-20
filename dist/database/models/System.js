import mongoose, { Schema, model } from "mongoose";
const apiKeySchema = new Schema({
    guildId: { type: String, required: true, index: true },
    key: { type: String, required: true, unique: true },
    createdBy: { type: String, required: true },
    revoked: { type: Boolean, default: false },
    lastUsedAt: { type: Date, default: null },
}, { timestamps: true });
const webhookSchema = new Schema({
    guildId: { type: String, default: null },
    url: { type: String, required: true },
    events: { type: [String], default: [] },
    createdBy: { type: String, required: true },
}, { timestamps: true });
const errorLogSchema = new Schema({
    message: { type: String, required: true },
    stack: { type: String, default: null },
    context: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });
const featureFlagSchema = new Schema({
    name: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    description: { type: String, default: "" },
}, { timestamps: true });
const supportStaffSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    addedBy: { type: String, required: true },
    ticketsHandled: { type: Number, default: 0 },
    dmsSent: { type: Number, default: 0 },
}, { timestamps: true });
const feedbackSchema = new Schema({
    userId: { type: String, required: true },
    guildId: { type: String, default: null },
    content: { type: String, required: true },
    response: { type: String, default: null },
    respondedBy: { type: String, default: null },
}, { timestamps: true });
const translationSchema = new Schema({
    language: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
}, { timestamps: true });
translationSchema.index({ language: 1, key: 1 }, { unique: true });
const coOwnerSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    grantedBy: { type: String, required: true },
    permissions: { type: [String], default: ["*"] },
}, { timestamps: true });
const maintenanceStateSchema = new Schema({
    key: { type: String, required: true, unique: true, default: "singleton" },
    enabled: { type: Boolean, default: false },
    reason: { type: String, default: null },
    message: { type: String, default: null },
}, { timestamps: true });
// Generic system-wide configuration document (singleton keyed by "singleton")
const systemSchema = new Schema({
    key: { type: String, required: true, unique: true, default: "singleton" },
    analytics: {
        totalCommands: { type: Number, default: 0 },
        totalServers: { type: Number, default: 0 },
        totalUsers: { type: Number, default: 0 },
        dailyCommands: { type: Number, default: 0 },
        weeklyCommands: { type: Number, default: 0 },
        monthlyCommands: { type: Number, default: 0 },
    },
    globalDisabledCommands: { type: [String], default: [] },
    globalCooldowns: { type: Map, of: Number, default: {} },
    globalSlowmode: { type: Number, default: 0 },
    globalBans: { type: [String], default: [] },
    globalCustomCommands: { type: [new Schema({ name: String, response: String, createdBy: String }, { _id: false })], default: [] },
}, { timestamps: true });
export const SystemModel = (mongoose.models["System"] ?? model("System", systemSchema));
export const ApiKeyModel = (mongoose.models["ApiKey"] ?? model("ApiKey", apiKeySchema));
export const WebhookModel = (mongoose.models["Webhook"] ?? model("Webhook", webhookSchema));
export const ErrorLogModel = (mongoose.models["ErrorLog"] ?? model("ErrorLog", errorLogSchema));
export const FeatureFlagModel = (mongoose.models["FeatureFlag"] ?? model("FeatureFlag", featureFlagSchema));
export const SupportStaffModel = (mongoose.models["SupportStaff"] ?? model("SupportStaff", supportStaffSchema));
export const FeedbackModel = (mongoose.models["Feedback"] ?? model("Feedback", feedbackSchema));
export const TranslationModel = (mongoose.models["Translation"] ?? model("Translation", translationSchema));
export const CoOwnerModel = (mongoose.models["CoOwner"] ?? model("CoOwner", coOwnerSchema));
export const MaintenanceStateModel = (mongoose.models["MaintenanceState"] ?? model("MaintenanceState", maintenanceStateSchema));
//# sourceMappingURL=System.js.map