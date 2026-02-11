import { dbPromise } from "@/app/api/lib/mongodb";


export async function sendSlackNotification({
  userId,
  message,
  blocks,
}: {
  userId: string;
  message: string;
  blocks?: any[];
}) {
  try {
    const db = await dbPromise;
    const integration = await db.collection("integrations").findOne({
      userId,
      provider: "slack",
      isActive: true,
    });

    if (!integration || !integration.metadata?.channelId) {
      console.log("Slack not configured for user:", userId);
      return { success: false, reason: "not_configured" };
    }

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${integration.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: integration.metadata.channelId,
        text: message,
        blocks: blocks || [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: message,
            },
          },
        ],
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack message failed:", data.error);
      return { success: false, error: data.error };
    }

    console.log("✅ Slack notification sent");
    return { success: true };
  } catch (error) {
    console.error("Slack notification error:", error);
    return { success: false, error };
  }
}

// Pre-built notification templates
export async function notifyDocumentViewed({
  userId,
  documentName,
  viewerName,
  viewerEmail,
  duration,
  location,
  documentId,
}: {
  userId: string;
  documentName: string;
  viewerName: string;
  viewerEmail: string;
  duration: number;
  location?: string;
  documentId: string;
}) {
  const durationFormatted = duration > 60 
    ? `${Math.floor(duration / 60)}m ${duration % 60}s`
    : `${duration}s`;

  return sendSlackNotification({
    userId,
    message: `🎯 ${viewerName} just viewed "${documentName}"`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🎯 Document Viewed*\n*${viewerName}* viewed *${documentName}*`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Email:*\n${viewerEmail}`,
          },
          {
            type: "mrkdwn",
            text: `*Time Spent:*\n${durationFormatted}`,
          },
          ...(location ? [{
            type: "mrkdwn",
            text: `*Location:*\n📍 ${location}`,
          }] : []),
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Analytics",
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
            style: "primary",
          },
        ],
      },
    ],
  });
}

export async function notifySignatureCompleted({
  userId,
  documentName,
  signerName,
  signerEmail,
  documentId,
}: {
  userId: string;
  documentName: string;
  signerName: string;
  signerEmail: string;
  documentId: string;
}) {
  return sendSlackNotification({
    userId,
    message: `✅ ${signerName} signed "${documentName}"`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*✅ Signature Collected*\n*${signerName}* signed *${documentName}*`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Email:*\n${signerEmail}`,
          },
          {
            type: "mrkdwn",
            text: `*Signed At:*\n${new Date().toLocaleString()}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Signed Document",
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
            style: "primary",
          },
        ],
      },
    ],
  });
}