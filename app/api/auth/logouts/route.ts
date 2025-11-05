import { NextResponse } from "next/server";
import { serialize } from "cookie";


export async function POST() {
 const expiredCookie = serialize("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0), // Expire immediately
    path: "/",
  });

  const response = NextResponse.json({ message: "Logout successful" });
  response.headers.set("Set-Cookie", expiredCookie);

  return response;
}