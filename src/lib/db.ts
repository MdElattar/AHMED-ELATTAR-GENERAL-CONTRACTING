import type { Model, Mongoose } from "mongoose";
import { hashPassword } from "@/lib/auth/password";
import type { ConsultationMode, ConsultationStatus } from "@/lib/consultation";
import {
  CONTENT_SLUG,
  buildSeedContent,
  buildSeedProjects,
  seedAdminIdentity,
} from "@/lib/db-seed";

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
  resetTokenHash?: string;
  resetTokenExpiry?: string;
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
  budget?: string;
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

export type StoredConsultation = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  topic: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, one of the shared CONSULTATION_SLOTS. */
  slot: string;
  mode: ConsultationMode;
  notes?: string;
  status: ConsultationStatus;
  createdAt: string;
  updatedAt: string;
};

export type NewConsultation = Omit<
  StoredConsultation,
  "id" | "reference" | "status" | "createdAt" | "updatedAt"
> & {
  status?: ConsultationStatus;
};

export type StoredSignoff = {
  id: string;
  projectSlug: string;
  email: string;
  signerName: string;
  contractHash: string;
  signedAt: string;
  ip?: string;
  milestones: {
    titleEn: string;
    verifiedAt: string;
    verifiedBy: string;
  }[];
  createdAt: string;
  updatedAt: string;
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
  consultations: Map<string, StoredConsultation>;
  signoffs: Map<string, StoredSignoff>;
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
  Consultation: LeanModel;
  Signoff: LeanModel;
};

const globalForDb = globalThis as unknown as {
  __alattarMemoryDb?: MemoryDb;
  __alattarMongoose?: MongooseCache;
  __alattarForceMemory?: boolean;
  __alattarMongoProbe?: Promise<boolean>;
};

function memory(): MemoryDb {
  if (!globalForDb.__alattarMemoryDb) {
    globalForDb.__alattarMemoryDb = {
      users: new Map(),
      projects: new Map(),
      inquiries: new Map(),
      audit: [],
      otps: new Map(),
      consultations: new Map(),
      signoffs: new Map(),
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

function hasMongoUri() {
  return Boolean(process.env.MONGODB_URI?.trim());
}

/** Synchronous diagnostics only; data access awaits `activeMode()`. */
export function databaseMode(): "mongodb" | "memory" {
  if (!hasMongoUri() || globalForDb.__alattarForceMemory) return "memory";
  return "mongodb";
}

/**
 * Resolves the active backend. In development an unreachable MongoDB instance
 * falls back to the seeded in-process repository so the product remains
 * runnable; in production it fails closed instead of silently losing writes.
 */
async function activeMode(): Promise<"mongodb" | "memory"> {
  if (!hasMongoUri()) {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_IN_MEMORY_DB !== "true") {
      throw new Error("MONGODB_URI is required in production.");
    }
    return "memory";
  }

  if (globalForDb.__alattarForceMemory) return "memory";

  if (!globalForDb.__alattarMongoProbe) {
    globalForDb.__alattarMongoProbe = connectMongo()
      .then(() => true)
      .catch((error: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          globalForDb.__alattarForceMemory = true;
          console.warn(
            "[db] MongoDB is unreachable — using the in-process development repository. " +
              "Start MongoDB or set a reachable MONGODB_URI to persist data.",
            error instanceof Error ? error.message : error,
          );
          return false;
        }
        throw error;
      });
  }

  const ok = await globalForDb.__alattarMongoProbe;
  return ok ? "mongodb" : "memory";
}

async function seedMemory() {
  const db = memory();
  if (db.seed) return db.seed;

  db.seed = (async () => {
    const identity = seedAdminIdentity();
    if (identity && !db.users.has(identity.email)) {
      const passwordHash = await hashPassword(identity.password);
      const timestamp = now();
      db.users.set(identity.email, {
        id: id(),
        email: identity.email,
        name: identity.name,
        company: identity.company,
        passwordHash,
        role: "admin",
        accountId: `ALT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    if (db.projects.size === 0) {
      const timestamp = now();
      for (const payload of buildSeedProjects()) {
        const slug = String(payload.slug);
        db.projects.set(slug, {
          id: id(),
          slug,
          featured: payload.featured === true,
          payload: { ...payload, slug },
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      db.projects.set(CONTENT_SLUG, {
        id: id(),
        slug: CONTENT_SLUG,
        featured: false,
        payload: buildSeedContent(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  })();

  try {
    await db.seed;
  } catch (error) {
    db.seed = null;
    throw error;
  }
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
        serverSelectionTimeoutMS: process.env.NODE_ENV === "production" ? 8000 : 2500,
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
        resetTokenHash: { type: String, index: true },
        resetTokenExpiry: { type: Date },
        lastLoginAt: { type: Date },
      },
      { timestamps: true, versionKey: false },
    );

    const projectSchema = new mongoose.Schema(
      {
        slug: { type: String, required: true, unique: true, index: true, lowercase: true },
        title: { type: mongoose.Schema.Types.Mixed },
        category: { type: String, index: true },
        location: { type: mongoose.Schema.Types.Mixed, index: true },
        images: [{ type: String }],
        specs: { type: mongoose.Schema.Types.Mixed },
        status: { type: String, index: true },
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
        budget: String,
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

    const consultationSchema = new mongoose.Schema(
      {
        reference: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        email: { type: String, required: true, index: true, lowercase: true },
        phone: { type: String, required: true },
        company: String,
        topic: { type: String, required: true },
        date: { type: String, required: true, index: true },
        slot: { type: String, required: true },
        mode: {
          type: String,
          enum: ["boardroom", "video", "site"],
          default: "boardroom",
          index: true,
        },
        notes: String,
        status: {
          type: String,
          enum: ["requested", "confirmed", "completed", "cancelled"],
          default: "requested",
          index: true,
        },
      },
      { timestamps: true, versionKey: false },
    );

    const signoffSchema = new mongoose.Schema(
      {
        projectSlug: { type: String, required: true, index: true, lowercase: true },
        email: { type: String, required: true, index: true, lowercase: true },
        signerName: { type: String, required: true },
        contractHash: { type: String, required: true },
        signedAt: { type: Date, required: true },
        ip: String,
        milestones: [
          {
            titleEn: { type: String, required: true },
            verifiedAt: { type: Date, required: true },
            verifiedBy: { type: String, required: true },
          },
        ],
      },
      { timestamps: true, versionKey: false },
    );
    signoffSchema.index({ projectSlug: 1, email: 1 }, { unique: true });

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
    const Consultation = (mongoose.models.Consultation ??
      mongoose.model("Consultation", consultationSchema)) as unknown as LeanModel;
    const Signoff = (mongoose.models.Signoff ??
      mongoose.model("Signoff", signoffSchema)) as unknown as LeanModel;

    return { User, Project, Inquiry, AuditLog, OtpToken, Consultation, Signoff };
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
    ...(str(doc.resetTokenHash) ? { resetTokenHash: str(doc.resetTokenHash) } : {}),
    ...(doc.resetTokenExpiry ? { resetTokenExpiry: iso(doc.resetTokenExpiry) } : {}),
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
    ...(str(doc.budget) ? { budget: str(doc.budget) } : {}),
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

function mapConsultation(doc: LeanDoc): StoredConsultation {
  const mode =
    doc.mode === "video" || doc.mode === "site" || doc.mode === "boardroom"
      ? doc.mode
      : "boardroom";
  const status =
    doc.status === "confirmed" || doc.status === "completed" || doc.status === "cancelled"
      ? doc.status
      : "requested";

  return {
    id: docId(doc),
    reference: str(doc.reference),
    name: str(doc.name),
    email: str(doc.email),
    phone: str(doc.phone),
    ...(str(doc.company) ? { company: str(doc.company) } : {}),
    topic: str(doc.topic),
    date: str(doc.date),
    slot: str(doc.slot),
    mode,
    ...(str(doc.notes) ? { notes: str(doc.notes) } : {}),
    status,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

function mapSignoff(doc: LeanDoc): StoredSignoff {
  const milestones = Array.isArray(doc.milestones)
    ? (doc.milestones as LeanDoc[])
        .map((milestone) => ({
          titleEn: str(milestone.titleEn),
          verifiedAt: iso(milestone.verifiedAt),
          verifiedBy: str(milestone.verifiedBy),
        }))
        .filter((milestone) => milestone.titleEn)
    : [];

  return {
    id: docId(doc),
    projectSlug: str(doc.projectSlug),
    email: str(doc.email),
    signerName: str(doc.signerName),
    contractHash: str(doc.contractHash),
    signedAt: iso(doc.signedAt),
    ...(str(doc.ip) ? { ip: str(doc.ip) } : {}),
    milestones,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

/* ------------------------------------------------------------------ users */

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  if ((await activeMode()) === "memory") {
    await seedMemory();
    return memory().users.get(normalized) ?? null;
  }

  const { User } = await mongoModels();
  const doc = (await User.findOne({ email: normalized }).lean()) as LeanDoc | null;
  return doc ? mapUser(doc) : null;
}

export async function getUserById(userId: string): Promise<StoredUser | null> {
  if ((await activeMode()) === "memory") {
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

  if ((await activeMode()) === "memory") {
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
  patch: Partial<
    Pick<
      StoredUser,
      | "name"
      | "company"
      | "phone"
      | "passwordHash"
      | "lastLoginAt"
      | "role"
      | "resetTokenHash"
      | "resetTokenExpiry"
    >
  >,
): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();

  if ((await activeMode()) === "memory") {
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

export async function setUserResetToken(
  email: string,
  tokenHash: string,
  expiresAt: string,
): Promise<StoredUser | null> {
  return updateUser(email, { resetTokenHash: tokenHash, resetTokenExpiry: expiresAt });
}

export async function clearUserResetToken(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();

  if ((await activeMode()) === "memory") {
    const db = memory();
    const existing = db.users.get(normalized);
    if (!existing) return;
    const next = { ...existing, updatedAt: now() };
    delete next.resetTokenHash;
    delete next.resetTokenExpiry;
    db.users.set(normalized, next);
    return;
  }

  const { User } = await mongoModels();
  await User.updateOne(
    { email: normalized },
    { $unset: { resetTokenHash: "", resetTokenExpiry: "" }, $set: { updatedAt: new Date() } },
  );
}

/* --------------------------------------------------------------- projects */

export async function listProjects(): Promise<StoredProject[]> {
  if ((await activeMode()) === "memory") {
    await seedMemory();
    return [...memory().projects.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }

  const { Project } = await mongoModels();
  const docs = (await Project.find({}).sort({ createdAt: -1 }).limit(200).lean()) as LeanDoc[];
  return docs.map(mapProject);
}

export async function getProjectBySlug(slug: string): Promise<StoredProject | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  if ((await activeMode()) === "memory") {
    await seedMemory();
    return memory().projects.get(normalized) ?? null;
  }

  const { Project } = await mongoModels();
  const doc = (await Project.findOne({ slug: normalized }).lean()) as LeanDoc | null;
  return doc ? mapProject(doc) : null;
}

/** Persisted site content (hero copy, services catalogue, overrides). */
export async function getSiteContent(): Promise<Record<string, unknown> | null> {
  const record = await getProjectBySlug(CONTENT_SLUG);
  return record?.payload ?? null;
}

export async function listServiceSlugs(): Promise<string[]> {
  const content = await getSiteContent();
  const services = Array.isArray(content?.services) ? content.services : [];
  return services
    .map((service) =>
      typeof service === "object" && service !== null && "slug" in service
        ? String((service as { slug?: unknown }).slug ?? "")
        : "",
    )
    .filter(Boolean);
}

export async function upsertProject(
  slug: string,
  payload: Record<string, unknown>,
): Promise<StoredProject> {
  const normalized = slug.trim().toLowerCase();

  if ((await activeMode()) === "memory") {
    await seedMemory();
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
  const images = Array.isArray(payload.gallery)
    ? payload.gallery.filter((item): item is string => typeof item === "string")
    : typeof payload.art === "string"
      ? [payload.art]
      : [];
  const specs = {
    area: payload.area ?? null,
    value: payload.value ?? null,
    year: payload.year ?? null,
    client: payload.client ?? null,
    scope: payload.scope ?? [],
    highlights: payload.highlights ?? [],
  };

  const doc = (await Project.findOneAndUpdate(
    { slug: normalized },
    {
      $set: {
        slug: normalized,
        title: payload.title ?? null,
        category: typeof payload.category === "string" ? payload.category : undefined,
        location: payload.location ?? null,
        images,
        specs,
        status: typeof payload.status === "string" ? payload.status : undefined,
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

  if ((await activeMode()) === "memory") {
    await seedMemory();
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

  if ((await activeMode()) === "memory") {
    memory().inquiries.set(inquiry.id, inquiry);
    return inquiry;
  }

  const { Inquiry } = await mongoModels();
  const created = await Inquiry.create(inquiry);
  const doc = (created as unknown as { toObject: () => LeanDoc }).toObject();
  return mapInquiry(doc);
}

export async function listInquiries(limit = 100): Promise<StoredInquiry[]> {
  if ((await activeMode()) === "memory") {
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
  if ((await activeMode()) === "memory") {
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

  if ((await activeMode()) === "memory") {
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
  if ((await activeMode()) === "memory") {
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

  if ((await activeMode()) === "memory") {
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

  if ((await activeMode()) === "memory") {
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

  if ((await activeMode()) === "memory") {
    const otp = memory().otps.get(normalized);
    if (otp) memory().otps.set(normalized, { ...otp, attempts: otp.attempts + 1 });
    return;
  }

  const { OtpToken } = await mongoModels();
  await OtpToken.updateOne({ email: normalized }, { $inc: { attempts: 1 } });
}

export async function consumeOtp(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();

  if ((await activeMode()) === "memory") {
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

/* ----------------------------------------------------------- consultations */

function consultationReference() {
  const year = new Date().getUTCFullYear();
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `VIP-${year}-${suffix}`;
}

export async function createConsultation(input: NewConsultation): Promise<StoredConsultation> {
  const timestamp = now();
  const consultation: StoredConsultation = {
    ...input,
    id: id(),
    reference: consultationReference(),
    status: input.status ?? "requested",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if ((await activeMode()) === "memory") {
    memory().consultations.set(consultation.id, consultation);
    return consultation;
  }

  const { Consultation } = await mongoModels();
  const created = await Consultation.create({
    reference: consultation.reference,
    name: consultation.name,
    email: consultation.email,
    phone: consultation.phone,
    ...(consultation.company ? { company: consultation.company } : {}),
    topic: consultation.topic,
    date: consultation.date,
    slot: consultation.slot,
    mode: consultation.mode,
    ...(consultation.notes ? { notes: consultation.notes } : {}),
    status: consultation.status,
  });
  const doc = (created as unknown as { toObject: () => LeanDoc }).toObject();
  return mapConsultation(doc);
}

export async function listConsultations(limit = 200): Promise<StoredConsultation[]> {
  if ((await activeMode()) === "memory") {
    return [...memory().consultations.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  const { Consultation } = await mongoModels();
  const docs = (await Consultation.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()) as LeanDoc[];
  return docs.map(mapConsultation);
}

export async function updateConsultationStatus(
  consultationId: string,
  status: ConsultationStatus,
): Promise<StoredConsultation | null> {
  if ((await activeMode()) === "memory") {
    const current = memory().consultations.get(consultationId);
    if (!current) return null;
    const next = { ...current, status, updatedAt: now() };
    memory().consultations.set(consultationId, next);
    return next;
  }

  const { Consultation } = await mongoModels();
  const doc = (await Consultation.findByIdAndUpdate(
    consultationId,
    { $set: { status, updatedAt: new Date() } },
    { new: true },
  ).lean()) as LeanDoc | null;
  return doc ? mapConsultation(doc) : null;
}

/**
 * Boardroom capacity is one meeting per slot. Video and site visits are not
 * capacity-bound, so only `boardroom` requests participate in slot locking.
 */
export async function listBookedSlots(
  date: string,
  mode: ConsultationMode = "boardroom",
): Promise<string[]> {
  if (mode !== "boardroom") return [];

  if ((await activeMode()) === "memory") {
    const slots = new Set<string>();
    for (const consultation of memory().consultations.values()) {
      if (
        consultation.date === date &&
        consultation.mode === "boardroom" &&
        (consultation.status === "requested" || consultation.status === "confirmed")
      ) {
        slots.add(consultation.slot);
      }
    }
    return [...slots];
  }

  const { Consultation } = await mongoModels();
  const docs = (await Consultation.find({
    date,
    mode: "boardroom",
    status: { $in: ["requested", "confirmed"] },
  })
    .select("slot")
    .lean()) as LeanDoc[];
  return [...new Set(docs.map((doc) => str(doc.slot)).filter(Boolean))];
}

/* --------------------------------------------------------------- sign-offs */

function signoffKey(projectSlug: string, email: string) {
  return `${projectSlug.trim().toLowerCase()}::${email.trim().toLowerCase()}`;
}

export async function getSignoff(
  projectSlug: string,
  email: string,
): Promise<StoredSignoff | null> {
  const key = signoffKey(projectSlug, email);

  if ((await activeMode()) === "memory") {
    return memory().signoffs.get(key) ?? null;
  }

  const { Signoff } = await mongoModels();
  const doc = (await Signoff.findOne({
    projectSlug: projectSlug.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
  }).lean()) as LeanDoc | null;
  return doc ? mapSignoff(doc) : null;
}

export async function listSignoffs(limit = 200): Promise<StoredSignoff[]> {
  if ((await activeMode()) === "memory") {
    return [...memory().signoffs.values()]
      .sort((a, b) => b.signedAt.localeCompare(a.signedAt))
      .slice(0, limit);
  }

  const { Signoff } = await mongoModels();
  const docs = (await Signoff.find({}).sort({ signedAt: -1 }).limit(limit).lean()) as LeanDoc[];
  return docs.map(mapSignoff);
}

export async function saveSignoff(input: {
  projectSlug: string;
  email: string;
  signerName: string;
  contractHash: string;
  ip?: string;
}): Promise<StoredSignoff> {
  const projectSlug = input.projectSlug.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const timestamp = now();
  const key = signoffKey(projectSlug, email);

  if ((await activeMode()) === "memory") {
    const db = memory();
    const existing = db.signoffs.get(key);
    // A scope or value change produces a new digest. The previous milestone
    // verifications belong to the old terms and must not survive re-signing.
    const termsChanged = Boolean(existing && existing.contractHash !== input.contractHash);
    const signoff: StoredSignoff = {
      id: existing?.id ?? id(),
      projectSlug,
      email,
      signerName: input.signerName,
      contractHash: input.contractHash,
      signedAt: timestamp,
      ...(input.ip ? { ip: input.ip } : {}),
      milestones: termsChanged ? [] : (existing?.milestones ?? []),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    db.signoffs.set(key, signoff);
    return signoff;
  }

  const { Signoff } = await mongoModels();
  const existing = (await Signoff.findOne({ projectSlug, email }).lean()) as LeanDoc | null;
  const termsChanged = Boolean(
    existing && str(existing.contractHash) !== input.contractHash,
  );

  const update: Record<string, unknown> = {
    $set: {
      signerName: input.signerName,
      contractHash: input.contractHash,
      signedAt: new Date(),
      ...(input.ip ? { ip: input.ip } : {}),
      ...(termsChanged ? { milestones: [] } : {}),
      updatedAt: new Date(),
    },
  };
  if (!existing) update.$setOnInsert = { milestones: [] };

  const doc = (await Signoff.findOneAndUpdate({ projectSlug, email }, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  }).lean()) as LeanDoc | null;
  if (!doc) throw new Error("signoff_failed");
  return mapSignoff(doc);
}

export async function saveMilestoneVerification(input: {
  projectSlug: string;
  email: string;
  titleEn: string;
  verifiedBy: string;
}): Promise<StoredSignoff | null> {
  const projectSlug = input.projectSlug.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const timestamp = now();
  const key = signoffKey(projectSlug, email);

  if ((await activeMode()) === "memory") {
    const db = memory();
    const existing = db.signoffs.get(key);
    if (!existing) return null;
    const milestones = [
      ...existing.milestones.filter((milestone) => milestone.titleEn !== input.titleEn),
      { titleEn: input.titleEn, verifiedAt: timestamp, verifiedBy: input.verifiedBy },
    ];
    const next = { ...existing, milestones, updatedAt: timestamp };
    db.signoffs.set(key, next);
    return next;
  }

  const { Signoff } = await mongoModels();
  const existing = (await Signoff.findOne({ projectSlug, email }).lean()) as LeanDoc | null;
  if (!existing) return null;

  const current = mapSignoff(existing);
  const milestones = [
    ...current.milestones.filter((milestone) => milestone.titleEn !== input.titleEn),
    { titleEn: input.titleEn, verifiedAt: timestamp, verifiedBy: input.verifiedBy },
  ];

  const doc = (await Signoff.findOneAndUpdate(
    { projectSlug, email },
    { $set: { milestones, updatedAt: new Date() } },
    { new: true },
  ).lean()) as LeanDoc | null;
  return doc ? mapSignoff(doc) : null;
}

/* ------------------------------------------------------------------- seed */

/**
 * Idempotent MongoDB bootstrap used by `npm run seed`: creates (or promotes)
 * the super-admin from ADMIN_EMAIL/ADMIN_PASSWORD and upserts the canonical
 * projects + site content. Requires a reachable MongoDB.
 */
export async function seedDatabase(): Promise<{
  admin: string;
  projects: number;
  content: boolean;
}> {
  if (!hasMongoUri()) {
    throw new Error("MONGODB_URI is required to seed MongoDB.");
  }

  // Force a real connection before any repository call so an unreachable
  // instance fails loudly instead of silently seeding the dev repository.
  await mongoModels();

  const identity = seedAdminIdentity();
  if (!identity) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters) are required to seed the super-admin.",
    );
  }

  let admin = await getUserByEmail(identity.email);
  if (!admin) {
    admin = await createUser({
      email: identity.email,
      name: identity.name,
      company: identity.company,
      passwordHash: await hashPassword(identity.password),
      role: "admin",
      accountId: `ALT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    });
  } else if (admin.role !== "admin") {
    admin = (await updateUser(identity.email, { role: "admin" })) ?? admin;
  }

  let projects = 0;
  for (const payload of buildSeedProjects()) {
    await upsertProject(String(payload.slug), payload);
    projects += 1;
  }
  await upsertProject(CONTENT_SLUG, buildSeedContent());

  return { admin: identity.email, projects, content: true };
}
