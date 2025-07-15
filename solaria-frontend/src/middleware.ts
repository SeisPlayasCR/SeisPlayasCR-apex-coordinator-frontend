import { NextRequest, NextResponse } from "next/server";
import { auth } from "./utils/auth";

export async function middleware(request: NextRequest) {
    const session = await auth();
    const { pathname } = request.nextUrl;

    const isLoginPage = pathname === "/login";
    const isAdminRoute = pathname.startsWith("/admin");

    if (!session && isAdminRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session && isLoginPage) {
        return NextResponse.redirect(new URL("/admin/users", request.url));
    }

    if (session && pathname === "/admin") {
        return NextResponse.redirect(new URL("/admin/users", request.url));
    }

    if (session && pathname === "/") {
        return NextResponse.redirect(new URL("/admin/users", request.url));
    }

    if (!session && pathname === "/") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next|_static|favicon.ico).*)"],
};
