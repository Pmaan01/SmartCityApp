import nodemailer from "nodemailer";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { statusChangeEmail } from "@/lib/email-templates";

// Lazy-initialized so env vars are definitely loaded and we get a clear error if misconfigured
function createMailer() {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,           // true for SSL (465), false for STARTTLS (587)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }, // allow self-signed certs in dev
  });
}

function createTwilio() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function sendEmail(to: string, subject: string, html: string) {
  const mailer = createMailer();
  try {
    await mailer.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    console.log(`[email] Sent "${subject}" → ${to}`);
  } catch (err) {
    console.error("[email] Failed to send:", err);
    throw err;
  }
}

export async function sendSMS(to: string, body: string) {
  const client = createTwilio();
  try {
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body,
    });
    console.log(`[sms] Sent to ${to}`);
  } catch (err) {
    console.error("[sms] Failed to send:", err);
    throw err;
  }
}

export async function notifyStatusChange(issueId: string, newStatus: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { reportedBy: true },
  });
  if (!issue) return;

  const user = issue.reportedBy;
  const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const plainMessage = `Your issue "${issue.title}" status has changed to: ${newStatus.replace(/_/g, " ")}.`;

  const jobs: Promise<void>[] = [];

  // Always create in-app notification
  jobs.push(
    prisma.notification
      .create({
        data: {
          userId: user.id,
          issueId,
          channel: "IN_APP",
          subject: `Issue Update: "${issue.title}"`,
          body: plainMessage,
        },
      })
      .then(() => {})
  );

  // Email — only if user has opted in (default true)
  if (user.email && user.notificationEmail) {
    const { subject, html } = statusChangeEmail({
      userName: user.name ?? "",
      issueTitle: issue.title,
      issueId: issue.id,
      newStatus,
      appUrl,
    });
    jobs.push(
      sendEmail(user.email, subject, html)
        .then(() =>
          prisma.notification.create({
            data: { userId: user.id, issueId, channel: "EMAIL", subject, body: plainMessage },
          })
        )
        .then(() => {})
        .catch((err) => console.error("[notify] Email job failed:", err))
    );
  }

  // SMS — only if user has phone + opted in
  if (user.phone && user.notificationSms) {
    const smsBody = `SmartCity: ${plainMessage} View: ${appUrl}/issues/${issueId}`;
    jobs.push(
      sendSMS(user.phone, smsBody)
        .then(() =>
          prisma.notification.create({
            data: { userId: user.id, issueId, channel: "SMS", body: smsBody },
          })
        )
        .then(() => {})
        .catch((err) => console.error("[notify] SMS job failed:", err))
    );
  }

  await Promise.allSettled(jobs);
}
