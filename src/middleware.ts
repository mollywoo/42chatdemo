import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * 路由中间件 - 保护需要认证的路由
 *
 * 功能：
 * 1. 未登录用户访问受保护路由 → 重定向到 /login
 * 2. 已登录用户访问 /login 或 /register → 重定向到 /
 * 3. 公开路由：/, /login, /register, /api/*
 * 4. 受保护路由：/chat, /settings
 */

// 定义受保护的路由
const PROTECTED_ROUTES = ["/chat", "/settings"];

// 定义认证路由（已登录用户不应访问）
const AUTH_ROUTES = ["/login", "/register"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过 API 路由和静态资源
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 检查会话状态
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthenticated = !!session?.user;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  // 情况 1：已登录用户访问登录/注册页面 → 重定向到首页
  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 情况 2：未登录用户访问受保护路由 → 重定向到登录页
  if (!isAuthenticated && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // 添加回调 URL，登录后返回
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 情况 3：其他情况正常放行
  return NextResponse.next();
}

// 配置中间件匹配的路径
export const config = {
  // 匹配所有路径，除了：
  // - _next/static (静态文件)
  // - _next/image (图片优化)
  // - favicon.ico (网站图标)
  // - public 文件夹中的文件
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon 文件)
     * - public 文件夹
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
