import nodemailer from "nodemailer";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { statusChangeEmail } from "@/lib/email-templates";

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendEmail(to: string, subject: string, html: string) {
  await mailer.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

export async function sendSMS(to: string, body: string) {
  await twilioClient.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
    body,
  });
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
        .catch(() => {})
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
        .catch(() => {})
    );
  }

  await Promise.allSettled(jobs);
}
