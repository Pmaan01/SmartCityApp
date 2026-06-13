import nodemailer from "nodemailer";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

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

export async function notifyStatusChange(
  issueId: string,
  newStatus: string
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { reportedBy: true },
  });
  if (!issue) return;

  const user = issue.reportedBy;
  const subject = `Issue Update: "${issue.title}"`;
  const message = `Your issue "${issue.title}" status has changed to: ${newStatus.replace(/_/g, " ")}.`;

  const jobs: Promise<void>[] = [];

  // Always create an in-app notification
  jobs.push(
    prisma.notification
      .create({
        data: {
          userId: user.id,
          issueId,
          channel: "IN_APP",
          subject,
          body: message,
        },
      })
      .then(() => {})
  );

  if (user.email) {
    jobs.push(
      sendEmail(user.email, subject, `<p>${message}</p>`)
        .then(() =>
          prisma.notification.create({
            data: { userId: user.id, issueId, channel: "EMAIL", subject, body: message },
          })
        )
        .then(() => {})
        .catch(() => {})
    );
  }

  if (user.phone) {
    jobs.push(
      sendSMS(user.phone, message)
        .then(() =>
          prisma.notification.create({
            data: { userId: user.id, issueId, channel: "SMS", body: message },
          })
        )
        .then(() => {})
        .catch(() => {})
    );
  }

  await Promise.allSettled(jobs);
}
