export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return { error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
    const role = userSnap.exists ? userSnap.data()?.role : null;

    if (role !== "admin") {
      return { error: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
    }

    return { adminUid: decoded.uid };
  } catch {
    return { error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
}

function pickString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeBody(body: unknown) {
  const payload = (body ?? {}) as Record<string, unknown>;
  const profile = (payload.profile ?? {}) as Record<string, unknown>;
  const address = (profile.address ?? {}) as Record<string, unknown>;

  return {
    email: pickString(payload.email).toLowerCase(),
    password: pickString(payload.password),
    active: payload.active === true,
    profile: {
      name: pickString(profile.name),
      document: pickString(profile.document),
      phone: pickString(profile.phone),
      cellphone: pickString(profile.cellphone),
      address: {
        street: pickString(address.street),
        number: pickString(address.number),
        neighborhood: pickString(address.neighborhood),
        complement: pickString(address.complement),
        zipCode: pickString(address.zipCode),
        city: pickString(address.city),
        state: pickString(address.state),
      },
    },
  };
}

export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  try {
    const raw = await req.json();
    const payload = sanitizeBody(raw);

    if (!payload.email) {
      return NextResponse.json({ ok: false, error: "E-mail é obrigatório." }, { status: 400 });
    }

    if (!payload.password || payload.password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Senha é obrigatória e precisa ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    if (!payload.profile.name) {
      return NextResponse.json({ ok: false, error: "Nome é obrigatório." }, { status: 400 });
    }

    const existingMethods = await adminAuth
      .getUserByEmail(payload.email)
      .then((user) => user)
      .catch(() => null);

    if (existingMethods) {
      return NextResponse.json(
        { ok: false, error: "Já existe um usuário com esse e-mail." },
        { status: 409 }
      );
    }

    const created = await adminAuth.createUser({
      email: payload.email,
      password: payload.password,
      emailVerified: true,
      displayName: payload.profile.name,
    });

    const now = new Date();

    await adminDb.collection("users").doc(created.uid).set(
      {
        uid: created.uid,
        email: payload.email,
        role: "student",
        name: payload.profile.name,
        source: "admin",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    await adminDb
      .collection("users")
      .doc(created.uid)
      .collection("profile")
      .doc("main")
      .set(
        {
          name: payload.profile.name,
          document: payload.profile.document || null,
          phone: payload.profile.phone || null,
          cellphone: payload.profile.cellphone || null,
          address: {
            street: payload.profile.address.street || null,
            number: payload.profile.address.number || null,
            neighborhood: payload.profile.address.neighborhood || null,
            complement: payload.profile.address.complement || null,
            zipCode: payload.profile.address.zipCode || null,
            city: payload.profile.address.city || null,
            state: payload.profile.address.state || null,
          },
          source: "admin",
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

    await adminDb.collection("entitlements").doc(created.uid).set(
      {
        uid: created.uid,
        email: payload.email,
        active: payload.active,
        pending: !payload.active,
        source: "admin",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, uid: created.uid }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar aluno.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
