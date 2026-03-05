import { dbPromise } from "@/app/api/lib/mongodb";

// Get valid Outlook token (auto-refresh)
export async function getValidOutlookToken(userId: string): Promise<string> {
  const db = await dbPromise;
  const integration = await db.collection("integrations").findOne({
    userId,
    provider: "outlook",
    isActive: true,
  });

  if (!integration) {
    throw new Error("Outlook not connected");
  }

  // Check if expired
  if (new Date() >= integration.expiresAt) {
    console.log("🔄 Outlook token expired, refreshing...");

    const refreshResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.OUTLOOK_CLIENT_ID!,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
          refresh_token: integration.refreshToken,
          scope: "https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access",
        }),
      }
    );

    const tokenData = await refreshResponse.json();

    if (tokenData.error) {
      throw new Error(`Outlook token refresh failed: ${tokenData.error}`);
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

    console.log("✅ Outlook token refreshed");
    return tokenData.access_token;
  }

  return integration.accessToken;
}

// Send email via Outlook with tracking
export async function sendEmailViaOutlook({
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
    const token = await getValidOutlookToken(userId);
    const db = await dbPromise;

    // Get document info
    const document = await db.collection("documents").findOne({ id: documentId });
    if (!document) {
      throw new Error("Document not found");
    }

    // Generate unique tracking link
    const shareToken = await generateShareToken(documentId, userId);
    const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL}/view/${shareToken}`;

    // Build tracking pixel
    const trackingPixelId = `${userId}-${documentId}-${Date.now()}`;
    const trackingPixel = `${process.env.NEXT_PUBLIC_APP_URL}/api/track/email-open/${trackingPixelId}.gif`;

    // Build recipients array for Microsoft Graph format
    const recipientList = (Array.isArray(to) ? to : [to]).map((email) => ({
      emailAddress: { address: email },
    }));

    // Build HTML body — same template as Gmail
    const htmlBody = `
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
    <div class="message">${message.replace(/\n/g, "<br>")}</div>
    
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

    // Microsoft Graph sendMail payload — this replaces Gmail's base64 raw format
    const payload = {
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: htmlBody,
        },
        toRecipients: recipientList,
      },
      saveToSentItems: true, // saves to user's Sent folder in Outlook
    };

    // Send via Microsoft Graph API
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/sendMail",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    // Graph API returns 202 Accepted on success (no body)
    if (!response.ok) {
      const data = await response.json();
      console.error("Outlook send error:", data);
      return { success: false, error: data.error };
    }

    // Log email sent — same collection as Gmail
    await db.collection("email_tracking").insertOne({
      userId,
      documentId,
      trackingPixelId,
      messageId: trackingPixelId, // Graph doesn't return messageId on sendMail
      provider: "outlook",
      recipients: Array.isArray(to) ? to : [to],
      subject,
      sentAt: new Date(),
      opened: false,
      openedAt: null,
      linkClicked: false,
      clickedAt: null,
    });

    console.log("✅ Email sent via Outlook");
    return { success: true };
  } catch (error) {
    console.error("Outlook send error:", error);
    return { success: false, error };
  }
}

// Generate unique share token for tracking — same as Gmail
async function generateShareToken(documentId: string, userId: string): Promise<string> {
  const db = await dbPromise;
  const token = Math.random().toString(36).substring(2, 15);

  await db.collection("share_tokens").insertOne({
    token,
    documentId,
    userId,
    createdAt: new Date(),
    expiresAt: null,
    views: [],
  });

  return token;
}