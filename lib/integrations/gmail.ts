 import { dbPromise } from "@/app/api/lib/mongodb";

// Get valid Gmail token (auto-refresh)
export async function getValidGmailToken(userId: string): Promise<string> {
  const db = await dbPromise;
  const integration = await db.collection("integrations").findOne({
    userId,
    provider: "gmail",
    isActive: true,
  });

  if (!integration) {
    throw new Error("Gmail not connected");
  }

  // Check if expired
  if (new Date() >= integration.expiresAt) {
    console.log("🔄 Gmail token expired, refreshing...");

    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: integration.refreshToken,
      }),
    });

    const tokenData = await refreshResponse.json();

    if (tokenData.error) {
      throw new Error(`Token refresh failed: ${tokenData.error}`);
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    await db.collection("integrations").updateOne(
      { _id: integration._id },
      {
        $set: {
          accessToken: tokenData.access_token,
          expiresAt,
          updatedAt: new Date(),
        },
      }
    );

    console.log("✅ Gmail token refreshed");
    return tokenData.access_token;
  }

  return integration.accessToken;
}

// Send email via Gmail with tracking
export async function sendEmailViaGmail({
  userId,
  to,
  subject,
  message,
  documentId,
}: {
  userId: string;
  to: string | string[];
  subject: string;
  message: string;
  documentId: string;
}) {
  try {
    const token = await getValidGmailToken(userId);
    const db = await dbPromise;

    // Get document info
    const document = await db.collection("documents").findOne({ id: documentId });
    if (!document) {
      throw new Error("Document not found");
    }

    // Generate unique tracking link
    const shareToken = await generateShareToken(documentId, userId);
    const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL}/view/${shareToken}`;

    // Build email with tracking pixel
    const trackingPixelId = `${userId}-${documentId}-${Date.now()}`;
    const trackingPixel = `${process.env.NEXT_PUBLIC_APP_URL}/api/track/email-open/${trackingPixelId}.gif`;

    const recipients = Array.isArray(to) ? to.join(",") : to;

    const emailContent = `From: me
To: ${recipients}
Subject: ${subject}
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .message { margin: 20px 0; }
    .button { 
      display: inline-block; 
      padding: 12px 24px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600;
      margin: 20px 0;
    }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="message">${message.replace(/\n/g, '<br>')}</div>
    
    <a href="${trackingLink}" class="button">
      📄 View ${document.originalFilename}
    </a>
    
    <div class="footer">
      <p>Sent via DocMetrics - Secure Document Sharing</p>
      <p style="font-size: 11px; color: #999;">
        This is a tracked document link. The sender will be notified when you view this document.
      </p>
    </div>
  </div>
  
  <!-- Tracking Pixel -->
  <img src="${trackingPixel}" width="1" height="1" style="display:none;" />
</body>
</html>`;

    // Encode email in base64url format
    const encodedEmail = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send via Gmail API
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gmail send error:", data);
      return { success: false, error: data.error };
    }

    // Log email sent
    await db.collection("email_tracking").insertOne({
      userId,
      documentId,
      trackingPixelId,
      messageId: data.id,
      recipients: Array.isArray(to) ? to : [to],
      subject,
      sentAt: new Date(),
      opened: false,
      openedAt: null,
      linkClicked: false,
      clickedAt: null,
    });

    console.log("✅ Email sent via Gmail");
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Gmail send error:", error);
    return { success: false, error };
  }
}

// Generate unique share token for tracking
async function generateShareToken(documentId: string, userId: string): Promise<string> {
  const db = await dbPromise;
  const token = Math.random().toString(36).substring(2, 15);

  await db.collection("share_tokens").insertOne({
    token,
    documentId,
    userId,
    createdAt: new Date(),
    expiresAt: null, // No expiry
    views: [],
  });

  return token;
}