import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  const body = await request.json();
  const { effective_date, expiry_date } = body;

  await sql`
    UPDATE files
    SET effective_date = ${effective_date}, expiry_date = ${expiry_date}
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const { id } = context.params;
//   const body = await request.json();
//   const { effective_date, expiry_date } = body;

  await sql`
    DELETE FROM files
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}