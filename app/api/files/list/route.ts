import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await sql`SELECT * FROM files ORDER BY id DESC`;
  return NextResponse.json({ files: result.rows });
}