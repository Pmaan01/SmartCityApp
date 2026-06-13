const STATUS_LABEL: Record<string, string> = {
  SUBMITTED:   "Submitted",
  IN_REVIEW:   "In Review",
  ASSIGNED:    "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED:    "Resolved",
  CLOSED:      "Closed",
};

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED:   "#6b7280",
  IN_REVIEW:   "#d97706",
  ASSIGNED:    "#2563eb",
  IN_PROGRESS: "#4f46e5",
  RESOLVED:    "#16a34a",
  CLOSED:      "#9ca3af",
};

function base(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 36px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,.15);border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                  <span style="font-size:18px;">🏙️</span>
                </td>
                <td style="padding-left:12px;">
                  <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-.3px;">SmartCity</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:36px;">${body}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You&rsquo;re receiving this because you reported an issue on SmartCity.<br/>
              To manage your notification settings, <a href="${process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? ""}/profile" style="color:#4f46e5;">visit your profile</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function statusChangeEmail(opts: {
  userName: string;
  issueTitle: string;
  issueId: string;
  newStatus: string;
  appUrl: string;
}) {
  const { userName, issueTitle, issueId, newStatus, appUrl } = opts;
  const label = STATUS_LABEL[newStatus] ?? newStatus.replace(/_/g, " ");
  const color = STATUS_COLOR[newStatus] ?? "#6b7280";
  const issueUrl = `${appUrl}/issues/${issueId}`;

  const isResolved = newStatus === "RESOLVED";

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700;">
      ${isResolved ? "✅ Issue Resolved!" : "🔄 Issue Status Update"}
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${userName || "there"},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Your reported issue has been updated. Here's the latest:
    </p>

    <!-- Issue card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Issue</p>
        <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">${issueTitle}</p>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:${color};border-radius:20px;padding:4px 14px;">
              <span style="color:#ffffff;font-size:13px;font-weight:600;">${label}</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${isResolved ? `
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Great news! Your issue has been resolved by our city team. Thank you for helping make our city better. 🎉
    </p>` : `
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Our team is actively working on your report. We'll keep you updated as the status changes.
    </p>`}

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#4f46e5;border-radius:10px;">
          <a href="${issueUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            View Issue Details →
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: isResolved
      ? `✅ Resolved: "${issueTitle}"`
      : `🔄 Update on "${issueTitle}": ${label}`,
    html: base(`Issue Update - ${label}`, body),
  };
}

export function welcomeEmail(opts: { userName: string; appUrl: string }) {
  const { userName, appUrl } = opts;

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700;">Welcome to SmartCity! 🏙️</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${userName || "there"},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      You're now part of a community that's making our city better, one report at a time.
      Here's what you can do:
    </p>

    <!-- Feature list -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${[
        ["📍", "Report Issues", "Spotted a pothole, broken streetlight, or graffiti? Report it in seconds."],
        ["📊", "Track Progress", "Follow your reports and get notified when the city responds."],
        ["🗺️", "City Map", "See all reported issues across the city in real time."],
        ["🤖", "AI Assistant", "Use our AI chatbot to get instant answers about city services."],
      ].map(([icon, title, desc]) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:20px;width:36px;vertical-align:top;padding-top:2px;">${icon}</td>
              <td style="padding-left:12px;">
                <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827;">${title}</p>
                <p style="margin:0;font-size:13px;color:#6b7280;">${desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join("")}
    </table>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#4f46e5;border-radius:10px;">
          <a href="${appUrl}/report" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            Report Your First Issue →
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: "Welcome to SmartCity — let's fix things together 🏙️",
    html: base("Welcome to SmartCity", body),
  };
}
