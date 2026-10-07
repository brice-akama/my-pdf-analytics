import { NextResponse } from "next/server";

const HOST = "docmetrics.io";
const KEY = process.env.INDEXNOW_KEY!;

export async function POST(req: Request) {
  // Simple protection so strangers can't use your route
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.INDEXNOW_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { urls } = await req.json();
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "No urls" }, { status: 400 });
  }

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    }),
  });

  return NextResponse.json({ status: res.status });
}