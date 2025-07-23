import { sql } from "@vercel/postgres";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "uchihabeats@gmail.com",
    pass: "dkypswkffnghqccx",
  },
});

export async function GET() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const oneMonthLater = new Date();
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  const yyyy2 = oneMonthLater.getFullYear();
  const mm2 = String(oneMonthLater.getMonth() + 1).padStart(2, "0");
  const dd2 = String(oneMonthLater.getDate()).padStart(2, "0");
  const oneMonthLaterStr = `${yyyy2}-${mm2}-${dd2}`;

  const result = await sql`
    SELECT f.*, u.email 
    FROM files f 
    JOIN users u ON f.user_id = u.id
    WHERE f.expiry_date >= ${todayStr}
      AND f.expiry_date <= ${oneMonthLaterStr}
      AND f.notification_sent = false
  `;

  let notified = [];
  for (const file of result.rows) {
    await transporter.sendMail({
      from: '"File Checker"',
      to: file.email,
      subject: "File Expiry Notification",
      text: `Your file (${file.file_url}) will expire on ${file.expiry_date}.`,
    });
    await sql`UPDATE files SET notification_sent = true WHERE id = ${file.id}`;
    notified.push(file.email);
  }

  return Response.json({ notified });
}