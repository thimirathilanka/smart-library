import "server-only";

import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import {
  createMember,
  getMemberByEmail,
  getMemberById,
  hasActiveMembership,
  isActiveAccount,
  publicMember,
} from "@/lib/data/members";
import { recordActivity } from "@/lib/data/activity";
import type { Member, MemberRecord } from "@/lib/types";

const TOKEN_TTL = "30d";
const NAME_MAX = 80;

export type MobileTokenPayload = {
  sub: string;
  email: string;
  name: string;
  isMember: boolean;
  isAdmin: boolean;
  isAuthor: boolean;
  accountActive: boolean;
};

export type MobileUser = {
  id: string;
  name: string;
  email: string;
  isMember: boolean;
  isAdmin: boolean;
  isAuthor: boolean;
  membershipExpiresAt?: string;
  status: Member["status"];
  reads: number;
  joinedAt: string;
  accountActive: boolean;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function memberToMobileUser(member: MemberRecord | Member): MobileUser {
  const active = isActiveAccount(member);
  return {
    id: member._id,
    name: member.name,
    email: member.email,
    isMember: hasActiveMembership(member),
    isAdmin: Boolean(member.isAdmin),
    isAuthor: Boolean(member.isAuthor),
    membershipExpiresAt: member.membershipExpiresAt,
    status: member.status,
    reads: member.reads,
    joinedAt: member.joinedAt,
    accountActive: active,
  };
}

export async function signMobileToken(member: MemberRecord | Member) {
  const user = memberToMobileUser(member);
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    isMember: user.isMember,
    isAdmin: user.isAdmin,
    isAuthor: user.isAuthor,
    accountActive: user.accountActive,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey());

  return { token, user };
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) return null;
    return {
      sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      isMember: Boolean(payload.isMember),
      isAdmin: Boolean(payload.isAdmin),
      isAuthor: Boolean(payload.isAuthor),
      accountActive: Boolean(payload.accountActive),
    };
  } catch {
    return null;
  }
}

export function isMobileClient(request: Request) {
  return request.headers.get("x-smart-library-client")?.trim().toLowerCase() === "mobile";
}

export function extractBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (match?.[1]) return match[1].trim();
  // Mobile clients must use Authorization Bearer only — never query tokens.
  if (isMobileClient(request)) return null;
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("access_token");
  return queryToken?.trim() || null;
}

export async function getMemberFromRequest(request: Request) {
  const token = extractBearerToken(request);
  if (!token) return null;
  const payload = await verifyMobileToken(token);
  if (!payload) return null;
  const member = await getMemberById(payload.sub);
  if (!member) return null;
  return member;
}

export async function requireActiveMemberFromRequest(request: Request) {
  const member = await getMemberFromRequest(request);
  if (!member || !isActiveAccount(member)) return null;
  return member;
}

export type MobileMemberResult =
  | { ok: true; member: MemberRecord }
  | { ok: false; status: 401 | 403; error: string };

/** Active account with paid membership (or admin). Used by mobile catalog/reading APIs. */
export async function requireMobileMember(request: Request): Promise<MobileMemberResult> {
  const member = await getMemberFromRequest(request);
  if (!member || !isActiveAccount(member)) {
    return { ok: false, status: 401, error: "Unauthorized." };
  }
  if (!member.isAdmin && !hasActiveMembership(member)) {
    return { ok: false, status: 403, error: "Active membership required." };
  }
  return { ok: true, member };
}

export function canUseMobileApp(member: MemberRecord | Member) {
  return isActiveAccount(member) && (Boolean(member.isAdmin) || hasActiveMembership(member));
}

export async function loginWithCredentials(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) {
    return { error: "Email and password are required." as const };
  }

  const member = await getMemberByEmail(email);
  if (!member || member.status === "Suspended") {
    return { error: "Invalid email or password." as const };
  }
  const valid = await compare(password, member.passwordHash);
  if (!valid) return { error: "Invalid email or password." as const };

  await recordActivity({ actorId: member._id, action: "auth.signed_in", detail: "Signed in (mobile)" });
  return signMobileToken(member);
}

export async function registerWithCredentials(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!firstName || !lastName || firstName.length > NAME_MAX || lastName.length > NAME_MAX) {
    return { error: "First and last name are required and must be 80 characters or fewer." as const };
  }
  if (!isEmail(email) || password.length < 8) {
    return { error: "Enter a valid email and a password of at least 8 characters." as const };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." as const };
  }

  const existing = await getMemberByEmail(email);
  if (existing) {
    return { error: "An account with that email already exists." as const };
  }

  const memberId = `u-${crypto.randomUUID()}`;
  const name = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
  const member: MemberRecord = {
    _id: memberId,
    name,
    email,
    isMember: false,
    isAdmin: false,
    isAuthor: false,
    joinedAt: new Date().toISOString().slice(0, 10),
    reads: 0,
    status: "Active",
    passwordHash: await hash(password, 10),
    library: { saved: [], history: [], favorites: [] },
  };
  await createMember(member);
  await recordActivity({ actorId: memberId, action: "auth.registered", detail: "Registered as reader (mobile)" });
  return signMobileToken(member);
}

export { publicMember };
