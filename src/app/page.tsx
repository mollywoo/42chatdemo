"use client";

import Link from "next/link";
import { APP_CONFIG, ROUTES } from "@/constants/config";
import { useSession, signOut } from "@/lib/auth/client";

export default function HomePage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!session) {
    // 未登录状态
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <div className="container flex max-w-[64rem] flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {APP_CONFIG.name}
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            {APP_CONFIG.description}
          </p>
          <div className="flex gap-4">
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              登录
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              注册
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            版本 {APP_CONFIG.version} · {APP_CONFIG.author}
          </p>
        </div>
      </div>
    );
  }

  // 已登录状态
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20">
      <div className="container flex max-w-[64rem] flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          欢迎回来，{session.user.name || session.user.email}！
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          {APP_CONFIG.description}
        </p>
        <div className="flex gap-4">
          <Link
            href={ROUTES.CHAT}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            开始对话
          </Link>
          <Link
            href={ROUTES.SETTINGS}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            设置
          </Link>
          <button
            onClick={async () => {
              await signOut();
              window.location.href = ROUTES.HOME;
            }}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            退出登录
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          版本 {APP_CONFIG.version} · {APP_CONFIG.author}
        </p>
      </div>
    </div>
  );
}
