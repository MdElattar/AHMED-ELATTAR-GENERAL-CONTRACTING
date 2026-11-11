import type { Model, Mongoose } from "mongoose";
import { hashPassword } from "@/lib/auth/password";

export type UserRole = "client" | "admin";

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  company: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

export type StoredProject = {
  id: string;
  slug: string;
  featured: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type InquiryStatus = "new" | "read" | "won" | "lost";

export type StoredInquiry = {
  id: string;
  kind: "contact" | "newsletter";
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  projectType?: string;
  location?: string;
  message?: string;
  files?: { name: string; size: number; type: string }[];
  reference?: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
};

export type StoredAudit = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
};

export type StoredOtp = {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: string;
  attempts: number;
  consumedAt?: string;
  createdAt: string;
};

export type NewUser = {
  email: string;
  name: string;
  company: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  accountId: string;
};

export type NewInquiry = Omit<StoredInquiry, "id" | "status" | "createdAt" | "updatedAt"> & {
  status?: InquiryStatus;
};

type MemoryDb = {
  users: Map<string, StoredUser>;
  projects: Map<string, StoredProject>;
  inquiries: Map<string, StoredInquiry>;
  audit: StoredAudit[];
  otps: Map<string, StoredOtp>;
  seed: Promise<void> | null;
};

type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
  models: Promise<MongoModels> | null;
};

type LeanDoc = Record<string, unknown>;
type LeanModel = Model<LeanDoc>;

type MongoModels = {
  User: LeanModel;
  Project: LeanModel;
  Inquiry: LeanModel;
  AuditLog: LeanModel;
  OtpToken: LeanModel;
};

const globalForDb = globalThis as unknown as {
  __alattarMemoryDb?: MemoryDb;
  __alattarMongoose?: MongooseCache;
};

function memory(): MemoryDb {
  if (!globalForDb.__alattarMemoryDb) {
    globalForDb.__alattarMemoryDb = {
      users: new Map(),
      projects: new Map(),
      inquiries: new Map(),
      audit: [],
      otps: new Map(),
      seed: null,
    };
  }
  return globalForDb.__alattarMemoryDb;
}

function id() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

export function databaseMode(): "mongodb" | "memory" {
  return process.env.MONGODB_URI?.trim() ? "mongodb" : "memory";
}

export function demoAccountsAllowed() {
  if (process.env.ALLOW_DEMO_ACCOUNTS === "true") return true;
  if (process.env.ALLOW_DEMO_ACCOUNTS === "false") return false;
  return process.env.NODE_ENV !== "production";
}

async function seedMemory() {
  const db = memory();
  if (db.seed) return db.seed;

  db.seed = (async () => {
    if (demoAccountsAllowed() && !db.users.has("demo@alattar.sa")) {
      const passwordHash = await hashPassword("demo1234");
      const timestamp = now();
      db.users.set("demo@alattar.sa", {
        id: "demo-admin",
        email: "demo@alattar.sa",
        name: "Mohammed Alabdullah",
        company: "Riyadh Development Holding",
        phone: "+966 55 214 8890",
        passwordHash,
        role: "admin",
        accountId: "ALT-2048",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword && adminPassword.length >= 8 && !db.users.has(adminEmail)) {
      const passwordHash = await hashPassword(adminPassword);
      const timestamp = now();
      db.users.set(adminEmail, {
        id: id(),
        email: adminEmail,
        name: process.env.ADMIN_NAME?.trim() || "Platform Administrator",
        company: "Ahmed Elattar General Contracting",
        passwordHash,
        role: "admin",
        accountId: `ALT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  })();

  return db.seed;
}

async function connectMongo(): Promise<Mongoose> {
  const cached =
    globalForDb.__alattarMongoose ??
    (globalForDb.__alattarMongoose = { conn: null, promise: null, models: null });

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = (async () => {
      const mongoose = (await import("mongoose")).default;
      mongoose.set("strictQuery", true);
      const uri = process.env.MONGODB_URI?.trim();
      if (!uri) throw new Error("MONGODB_URI is not configured");
      return mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      });
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

async function mongoModels(): Promise<MongoModels> {
  const cached =
    globalForDb.__alattarMongoose ??
    (globalForDb.__alattarMongoose = { conn: null, promise: null, models: null });

  if (cached.models) return cached.models;

  cached.models = (async () => {
    await connectMongo();
    const mongoose = (await import("mongoose")).default;

    const userSchema = new mongoose.Schema(
      {
        email: { type: String, required: true, unique: true, index: true, lowercase: true },
        name: { type: String, required: true },
        company: { type: String, required: true },
        phone: { type: String },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["client", "admin"], default: "client", index: true },
        accountId: { type: String, required: true, index: true },
        lastLoginAt: { type: Date },
      },
      { timestamps: true, versionKey: false },
    );

    const projectSchema = new mongoose.Schema(
      {
        slug: { type: String, required: true, unique: true, index: true, lowercase: true },
        featured: { type: Boolean, default: false, index: true },
        payload: { type: mongoose.Schema.Types.Mixed, required: true },
      },
      { timestamps: true, versionKey: false, strict: false },
    );

    const inquirySchema = new mongoose.Schema(
      {
        kind: { type: String, enum: ["contact", "newsletter"], default: "contact", index: true },
        name: String,
        email: { type: String, required: true, index: true, lowercase: true },
        phone: String,
        company: String,
        service: String,
        projectType: String,
        location: String,
        message: String,
        files: [{ name: String, size: Number, type: String }],
        reference: { type: String, index: true },
        status: {
          type: String,
          enum: ["new", "read", "won", "lost"],
          default: "new",
          index: true,
        },
      },
      { timestamps: true, versionKey: false },
    );

    const auditSchema = new mongoose.Schema(
      {
        actor: { type: String, required: true, index: true },
        action: { type: String, required: true, index: true },
        entity: { type: String, required: true, index: true },
        entityId: { type: String, index: true },
        meta: { type: mongoose.Schema.Types.Mixed },
        ip: String,
      },
      { timestamps: true, versionKey: false },
    );

    const otpSchema = new mongoose.Schema(
      {
        email: { type: String, required: true, index: true, lowercase: true },
        codeHash: { type: String, required: true },
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
        attempts: { type: Number, default: 0 },
        consumedAt: Date,
      },
      { timestamps: true, versionKey: false },
    );

    const User = (mongoose.models.User ??
      mongoose.model("User", userSchema)) as unknown as LeanModel;
    const Project = (mongoose.models.Project ??
      mongoose.model("Project", projectSchema)) as unknown as LeanModel;
    const Inquiry = (mongoose.models.Inquiry ??
      mongoose.model("Inquiry", inquirySchema)) as unknown as LeanModel;
    const AuditLog = (mongoose.models.AuditLog ??
      mongoose.model("AuditLog", auditSchema)) as unknown as LeanModel;
    const OtpToken = (mongoose.models.OtpToken ??
      mongoose.model("OtpToken", otpSchema)) as unknown as LeanModel;

    return { User, Project, Inquiry, AuditLog, OtpToken };
  })();

  try {
    return await cached.models;
  } catch (error) {
    cached.models = null;
    throw error;
  }
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function docId(doc: LeanDoc) {
  const value = doc._id ?? doc.id;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return String(value);
  }
  return "";
}

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return now();
}

function mapUser(doc: LeanDoc): StoredUser {
  return {
    id: docId(doc),
    email: str(doc.email),
    name: str(doc.name),
    company: str(doc.company),
    ...(str(doc.phone) ? { phone: str(doc.phone) } : {}),
    passwordHash: str(doc.passwordHash),
    role: doc.role === "admin" ? "admin" : "client",
    accountId: str(doc.accountId),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
    ...(doc.lastLoginAt ? { lastLoginAt: iso(doc.lastLoginAt) } : {}),
  };
}

function mapProject(doc: LeanDoc): StoredProject {
  const payload =
    typeof doc.payload === "object" && doc.payload !== null
      ? (doc.payload as Record<string, unknown>)
      : {};
  return {
    id: docId(doc),
    slug: str(doc.slug),
    featured: doc.featured === true,
    payload,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

function mapInquiry(doc: LeanDoc): StoredInquiry {
  const files = Array.isArray(doc.files)
    ? (doc.files as { name?: unknown; size?: unknown; type?: unknown }[])
        .map((file) => ({
          name: str(file.name),
          size: typeof file.size === "number" ? file.size : 0,
          type: str(file.type),
        }))
        .filter((file) => file.name)
    : undefined;

  return {
    id: docId(doc),
    kind: doc.kind === "newsletter" ? "newsletter" : "contact",
    ...(str(doc.name) ? { name: str(doc.name) } : {}),
    email: str(doc.email),
    ...(str(doc.phone) ? { phone: str(doc.phone) } : {}),
    ...(str(doc.company) ? { company: str(doc.company) } : {}),
    ...(str(doc.service) ? { service: str(doc.service) } : {}),
    ...(str(doc.projectType) ? { projectType: str(doc.projectType) } : {}),
    ...(str(doc.location) ? { location: str(doc.location) } : {}),
    ...(str(doc.message) ? { message: str(doc.message) } : {}),
    ...(files?.length ? { files } : {}),
    ...(str(doc.reference) ? { reference: str(doc.reference) } : {}),
    status:
      doc.status === "read" || doc.status === "won" || doc.status === "lost" ? doc.status : "new",
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

function mapAudit(doc: LeanDoc): StoredAudit {
  return {
    id: docId(doc),
    actor: str(doc.actor),
    action: str(doc.action),
    entity: str(doc.entity),
    ...(str(doc.entityId) ? { entityId: str(doc.entityId) } : {}),
    ...(typeof doc.meta === "object" && doc.meta !== null
      ? { meta: doc.meta as Record<string, unknown> }
      : {}),
    ...(str(doc.ip) ? { ip: str(doc.ip) } : {}),
    createdAt: iso(doc.createdAt),
  };
}

function mapOtp(doc: LeanDoc): StoredOtp {
  return {
    id: docId(doc),
    email: str(doc.email),
    codeHash: str(doc.codeHash),
    expiresAt: iso(doc.expiresAt),
    attempts: typeof doc.attempts === "number" ? doc.attempts : 0,
    ...(doc.consumedAt ? { consumedAt: iso(doc.consumedAt) } : {}),
    createdAt: iso(doc.createdAt),
  };
}

/* ------------------------------------------------------------------ users */

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  if (databaseMode() === "memory") {
    await seedMemory();
    return memory().users.get(normalized) ?? null;
  }

  const { User } = await mongoModels();
  const doc = (await User.findOne({ email: normalized }).lean()) as LeanDoc | null;
  return doc ? mapUser(doc) : null;
}

export async function getUserById(userId: string): Promise<StoredUser | null> {
  if (databaseMode() === "memory") {
    await seedMemory();
    for (const user of memory().users.values()) {
      if (user.id === userId) return user;
    }
    return null;
  }

  const { User } = await mongoModels();
  const doc = (await User.findById(userId).lean()) as LeanDoc | null;
  return doc ? mapUser(doc) : null;
}

export async function createUser(input: NewUser): Promise<StoredUser> {
  const timestamp = now();
  const user: StoredUser = {
    id: id(),
    email: input.email.trim().toLowerCase(),
    name: input.name,
    company: input.company,
    ...(input.phone ? { phone: input.phone } : {}),
    passwordHash: input.passwordHash,
    role: input.role,
    accountId: input.accountId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (databaseMode() === "memory") {
    await seedMemory();
    const db = memory();
    if (db.users.has(user.email)) throw new Error("email_taken");
    db.users.set(user.email, user);
    return user;
  }

  const { User } = await mongoModels();
  const created = await User.create({
    email: user.email,
    name: user.name,
    company: user.company,
    ...(user.phone ? { phone: user.phone } : {}),
    passwordHash: user.passwordHash,
    role: user.role,
    accountId: user.accountId,
  });
  const doc = (created as unknown as { toObject: () => LeanDoc }).toObject();
  return mapUser(doc);
}

export async function updateUser(
  email: string,
  patch: Partial<Pick<StoredUser, "name" | "company" | "phone" | "passwordHash" | "lastLoginAt">>,
): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();

  if (databaseMode() === "memory") {
    await seedMemory();
    const db = memory();
    const existing = db.users.get(normalized);
    if (!existing) return null;
    const next: StoredUser = {
      ...existing,
      ...patch,
      updatedAt: now(),
    };
    db.users.set(normalized, next);
    return next;
  }

  const { User } = await mongoModels();
  const doc = (await User.findOneAndUpdate(
    { email: normalized },
    { $set: { ...patch, updatedAt: new Date() } },
    { new: true },
  ).lean()) as LeanDoc | null;
  return doc ? mapUser(doc) : null;
}

/* --------------------------------------------------------------- projects */

export async function listProjects(): Promise<StoredProject[]> {
  if (databaseMode() === "memory") {
    return [...memory().projects.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }

  const { Project } = await mongoModels();
  const docs = (await Project.find({}).sort({ createdAt: -1 }).limit(200).lean()) as LeanDoc[];
  return docs.map(mapProject);
}

export async function upsertProject(
  slug: string,
  payload: Record<string, unknown>,
): Promise<StoredProject> {
  const normalized = slug.trim().toLowerCase();

  if (databaseMode() === "memory") {
    const db = memory();
    const existing = db.projects.get(normalized);
    const timestamp = now();
    const project: StoredProject = {
      id: existing?.id ?? id(),
      slug: normalized,
      featured: payload.featured === true,
      payload: { ...payload, slug: normalized },
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    db.projects.set(normalized, project);
    return project;
  }

  const { Project } = await mongoModels();
  const doc = (await Project.findOneAndUpdate(
    { slug: normalized },
    {
      $set: {
        slug: normalized,
        featured: payload.featured === true,
        payload: { ...payload, slug: normalized },
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { new: true, upsert: true },
  ).lean()) as LeanDoc;
  return mapProject(doc);
}

export async function deleteProject(slug: string): Promise<boolean> {
  const normalized = slug.trim().toLowerCase();

  if (databaseMode() === "memory") {
    return memory().projects.delete(normalized);
  }

  const { Project } = await mongoModels();
  const result = await Project.deleteOne({ slug: normalized });
  return (result.deletedCount ?? 0) > 0;
}

/* -------------------------------------------------------------- inquiries */

export async function createInquiry(input: NewInquiry): Promise<StoredInquiry> {
  const timestamp = now();
  const inquiry: StoredInquiry = {
    ...input,
    id: id(),
    status: input.status ?? "new",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (databaseMode() === "memory") {
    memory().inquiries.set(inquiry.id, inquiry);
    return inquiry;
  }

  const { Inquiry } = await mongoModels();
  const created = await Inquiry.create(inquiry);
  const doc = (created as unknown as { toObject: () => LeanDoc }).toObject();
  return mapInquiry(doc);
}

export async function listInquiries(limit = 100): Promise<StoredInquiry[]> {
  if (databaseMode() === "memory") {
    return [...memory().inquiries.values()]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  }

  const { Inquiry } = await mongoModels();
  const docs = (await Inquiry.find({}).sort({ createdAt: -1 }).limit(limit).lean()) as LeanDoc[];
  return docs.map(mapInquiry);
}

export async function updateInquiry(
  inquiryId: string,
  patch: Partial<Pick<StoredInquiry, "status">>,
): Promise<StoredInquiry | null> {
  if (databaseMode() === "memory") {
    const db = memory();
    const existing = db.inquiries.get(inquiryId);
    if (!existing) return null;
    const next = { ...existing, ...patch, updatedAt: now() };
    db.inquiries.set(inquiryId, next);
    return next;
  }

  const { Inquiry } = await mongoModels();
  const doc = (await Inquiry.findByIdAndUpdate(
    inquiryId,
    { $set: { ...patch, updatedAt: new Date() } },
    { new: true },
  ).lean()) as LeanDoc | null;
  return doc ? mapInquiry(doc) : null;
}

/* ------------------------------------------------------------------ audit */

export async function recordAudit(
  entry: Omit<StoredAudit, "id" | "createdAt">,
): Promise<void> {
  const audit: StoredAudit = { ...entry, id: id(), createdAt: now() };

  if (databaseMode() === "memory") {
    memory().audit.unshift(audit);
    if (memory().audit.length > 1000) memory().audit.length = 1000;
    return;
  }

  try {
    const { AuditLog } = await mongoModels();
    await AuditLog.create(audit);
  } catch (error) {
    console.error("[audit] failed to persist entry", error);
  }
}

export async function listAudit(limit = 50): Promise<StoredAudit[]> {
  if (databaseMode() === "memory") {
    return memory().audit.slice(0, limit);
  }

  const { AuditLog } = await mongoModels();
  const docs = (await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit).lean()) as LeanDoc[];
  return docs.map(mapAudit);
}

/* -------------------------------------------------------------------- otp */

export async function saveOtp(input: {
  email: string;
  codeHash: string;
  expiresAt: string;
}): Promise<StoredOtp> {
  const email = input.email.trim().toLowerCase();
  const timestamp = now();
  const otp: StoredOtp = {
    id: id(),
    email,
    codeHash: input.codeHash,
    expiresAt: input.expiresAt,
    attempts: 0,
    createdAt: timestamp,
  };

  if (databaseMode() === "memory") {
    memory().otps.set(email, otp);
    return otp;
  }

  const { OtpToken } = await mongoModels();
  await OtpToken.deleteMany({ email });
  const created = await OtpToken.create(otp);
  const doc = (created as unknown as { toObject: () => LeanDoc }).toObject();
  return mapOtp(doc);
}

export async function getOtp(email: string): Promise<StoredOtp | null> {
  const normalized = email.trim().toLowerCase();

  if (databaseMode() === "memory") {
    return memory().otps.get(normalized) ?? null;
  }

  const { OtpToken } = await mongoModels();
  const doc = (await OtpToken.findOne({ email: normalized })
    .sort({ createdAt: -1 })
    .lean()) as LeanDoc | null;
  return doc ? mapOtp(doc) : null;
}

export async function incrementOtpAttempts(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();

  if (databaseMode() === "memory") {
    const otp = memory().otps.get(normalized);
    if (otp) memory().otps.set(normalized, { ...otp, attempts: otp.attempts + 1 });
    return;
  }

  const { OtpToken } = await mongoModels();
  await OtpToken.updateOne({ email: normalized }, { $inc: { attempts: 1 } });
}

export async function consumeOtp(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();

  if (databaseMode() === "memory") {
    const otp = memory().otps.get(normalized);
    if (otp) {
      memory().otps.set(normalized, { ...otp, consumedAt: now(), attempts: otp.attempts + 1 });
    }
    return;
  }

  const { OtpToken } = await mongoModels();
  await OtpToken.updateOne(
    { email: normalized },
    { $set: { consumedAt: new Date() }, $inc: { attempts: 1 } },
  );
}
