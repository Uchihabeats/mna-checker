import { sql } from "@vercel/postgres";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const hashedPassword = await hash(password, 10);
  await sql`INSERT INTO users (email, password) VALUES (${email}, ${hashedPassword})`;
  return NextResponse.json({ success: true });
}
