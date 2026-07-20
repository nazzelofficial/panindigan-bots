import mongoose from "mongoose";
import { requireEnv } from "../config/config.js";
import { scopedLogger } from "../utils/logger.js";

const log = scopedLogger("database");

let connecting: Promise<typeof mongoose> | null = null;

/** Exponential backoff delays in ms: 1 s → 2 s → 4 s → 8 s → 30 s cap. */
const BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 30_000];

async function attemptConnect(uri: string, attempt: number): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize:              10,
      minPoolSize:               2,
      socketTimeoutMS:      45_000,
      serverSelectionTimeoutMS: 5_000,
      heartbeatFrequencyMS:  10_000,
      bufferCommands:           false,
    });
    return conn;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const delay   = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]!;
    log.warn(`DB connection attempt ${attempt + 1} failed — retrying in ${delay / 1_000}s`, { error: message });
    await new Promise((r) => setTimeout(r, delay));
    return attemptConnect(uri, attempt + 1);
  }
}

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connecting) return connecting;

  const uri = requireEnv("MONGODB_URI");

  mongoose.connection.on("connected",    () => log.info("MongoDB connected"));
  mongoose.connection.on("disconnected", () => log.warn("MongoDB disconnected — reconnecting…"));
  mongoose.connection.on("reconnected",  () => log.info("MongoDB reconnected"));
  mongoose.connection.on("error",   (err) => log.error("MongoDB connection error", { error: err.message }));
  mongoose.connection.on("close",        () => log.warn("MongoDB connection closed"));

  // Enable Mongoose's built-in auto-reconnect on disconnect
  mongoose.connection.on("disconnected", () => {
    connecting = null; // allow re-entry
    connectDatabase().catch((err) =>
      log.error("Auto-reconnect failed", { error: err instanceof Error ? err.message : String(err) }),
    );
  });

  connecting = attemptConnect(uri, 0);
  await connecting;
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  connecting = null;
  await mongoose.disconnect();
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Run a lightweight admin ping against the DB and return true if it responds.
 * Used by the monitoring subsystem.
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    if (!isDatabaseConnected()) return false;
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch {
    return false;
  }
}
