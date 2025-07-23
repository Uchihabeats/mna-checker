import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { userId, name, fileUrl, effectiveDate, expiryDate } = await req.json();
  await sql`INSERT INTO files (user_id, name, file_url, effective_date, expiry_date) VALUES (${userId}, ${name}, ${fileUrl}, ${effectiveDate}, ${expiryDate})`;
  return NextResponse.json({ success: true });
}
