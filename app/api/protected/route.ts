import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { parse } from "cookie"; // ✅ use named import

const SECRET_KEY = process.env.JWT_SECRET_KEY!;

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parse(cookieHeader || ''); // ✅ correctly using parse()
  const token = cookies.auth_token;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return NextResponse.json({ message: "Token is valid", user: decoded });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}