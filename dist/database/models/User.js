import mongoose, { Schema, model } from "mongoose";
const InventoryItemSchema = new Schema({ itemId: String, name: String, quantity: { type: Number, default: 1 } }, { _id: false });
const GuildProfileSchema = new Schema({
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastXpAt: { type: Date, default: null },
    voiceXp: { type: Number, default: 0 },
    prestige: { type: Number, default: 0 },
    balance: { type: Number, default: 500 },
    bank: { type: Number, default: 0 },
    inventory: { type: [InventoryItemSchema], default: [] },
    lastDaily: { type: Date, default: null },
    lastWeekly: { type: Date, default: null },
    lastMonthly: { type: Date, default: null },
    lastWork: { type: Date, default: null },
    lastBeg: { type: Date, default: null },
    lastCrime: { type: Date, default: null },
    lastDailyXp: { type: Date, default: null },
    lastWeeklyXp: { type: Date, default: null },
    lastHunting: { type: Date, default: null },
    lastFishing: { type: Date, default: null },
    lastMining: { type: Date, default: null },
    jobId: { type: String, default: null },
    fishingRod: { type: Number, default: 0 },
    pickaxe: { type: Number, default: 0 },
    rankCardBackground: { type: String, default: null },
    rankCardColor: { type: String, default: null },
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    gamesTied: { type: Number, default: 0 },
    totalGambled: { type: Number, default: 0 },
    totalGambledWon: { type: Number, default: 0 },
    farmPlots: {
        type: [new Schema({
                crop: { type: String, default: null },
                plantedAt: { type: Date, default: null },
                wateredAt: { type: Date, default: null },
                harvestAt: { type: Date, default: null },
                upgraded: { type: Boolean, default: false },
            }, { _id: false })],
        default: [],
    },
    petData: { type: Schema.Types.Mixed, default: null },
    businessData: { type: Schema.Types.Mixed, default: null },
    investmentPortfolio: {
        type: [new Schema({
                ticker: { type: String, required: true },
                shares: { type: Number, default: 0 },
                avgBuyPrice: { type: Number, default: 0 },
            }, { _id: false })],
        default: [],
    },
    lotteryTickets: { type: Number, default: 0 },
}, { _id: false });
const ReminderSchema = new Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    remindAt: { type: Date, required: true },
    channelId: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
}, { _id: false });
const userSchema = new Schema({
    userId: { type: String, required: true, unique: true, index: true },
    globalXp: { type: Number, default: 0 },
    guilds: { type: [GuildProfileSchema], default: [] },
    afk: {
        active: { type: Boolean, default: false },
        reason: { type: String, default: null },
        since: { type: Date, default: null },
    },
    reminders: { type: [ReminderSchema], default: [] },
    badges: { type: [String], default: [] },
    reputation: { type: Number, default: 0 },
    aiMessagesUsedToday: { type: Number, default: 0 },
    aiUsageResetAt: { type: Date, default: null },
}, { timestamps: true });
// Compound index: speeds up per-guild profile lookups across users
userSchema.index({ "guilds.guildId": 1, userId: 1 });
userSchema.methods.getGuildProfile = function (guildId) {
    let profile = this.guilds.find((g) => g.guildId === guildId);
    if (!profile) {
        this.guilds.push({ guildId });
        profile = this.guilds[this.guilds.length - 1];
    }
    return profile;
};
export const UserModel = (mongoose.models["User"] ?? model("User", userSchema));
//# sourceMappingURL=User.js.map