// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("huce_access_token")?.value;
  const role = req.cookies.get("huce_role")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const allowedRoles = ["admin", "manager"];
  if (role && !allowedRoles.includes(role.toLowerCase())) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manager/:path*"],
};
