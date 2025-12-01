// src/lib/anonCookie.ts
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function getOrCreateAnonId() {
  const cookieStore = await cookies(); // <- await

  const existing = cookieStore.get("naget_anon_id")?.value;
  if (existing) return existing;

  const newId = randomUUID();

  cookieStore.set("naget_anon_id", newId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 rok
  });

  return newId;
}
