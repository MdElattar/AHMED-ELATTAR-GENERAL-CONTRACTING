import { NextResponse, connection, type NextRequest } from "next/server";
import { currentSession } from "@/lib/auth/guard";
import { contractDigest, projectTitle } from "@/lib/contract";
import { getProjectBySlug, getSignoff, recordAudit, saveSignoff } from "@/lib/db";
import { dispatchAdminAlert } from "@/lib/notifications";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { contractSignSchema } from "@/lib/security/schemas";
import { cleanString, isPlainObject } from "@/lib/security/validation";

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

export async function GET(request: NextRequest) {
  await connection();

  const session = await currentSession();
  if (!session) return unauthorized();

  const projectSlug = cleanString(request.nextUrl.searchParams.get("projectSlug"), 120).toLowerCase();
  if (!projectSlug) {
    return NextResponse.json(
      { error: "invalid_project" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const project = await getProjectBySlug(projectSlug);
  if (!project) {
    return NextResponse.json(
      { error: "project_not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const signoff = await getSignoff(projectSlug, session.email);
  // A signed digest that no longer matches the live project means the
  // commercial terms changed after signing. The portal must ask for a fresh
  // signature before allowing milestone verification.
  const outdated = Boolean(signoff && signoff.contractHash !== contractDigest(project));

  return NextResponse.json({ signoff, outdated }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await currentSession();
  if (!session) return unauthorized();

  const limited = rateLimit(`contract-sign:${session.email}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: limited.retryAfter },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  const body = await readJsonBody(request, 12_000);
  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "invalid_body" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = contractSignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues.map((issue) => issue.message) },
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  const data = parsed.data;
  const project = await getProjectBySlug(data.projectSlug);
  if (!project) {
    return NextResponse.json(
      { error: "project_not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const signoff = await saveSignoff({
    projectSlug: project.slug,
    email: session.email,
    signerName: data.signatureName,
    contractHash: contractDigest(project),
    ip: clientIp(request),
  });

  await recordAudit({
    actor: session.email,
    action: "contract.signed",
    entity: "project",
    entityId: project.slug,
    meta: {
      signer: data.signatureName,
      digest: signoff.contractHash.slice(0, 16),
    },
    ip: clientIp(request),
  });

  await dispatchAdminAlert({
    title: "Contract digitally signed",
    message: `${data.signatureName} signed the contract for ${projectTitle(project).en}.`,
    meta: {
      Project: projectTitle(project).en,
      Client: session.email,
      Digest: signoff.contractHash.slice(0, 16),
    },
  });

  return NextResponse.json({ signoff, outdated: false }, { status: 201, headers: NO_STORE_HEADERS });
}
