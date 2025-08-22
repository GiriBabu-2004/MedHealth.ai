import { clerkMiddleware } from "@clerk/nextjs/server"; // ✅ CORRECT import

export const middleware = clerkMiddleware({
  publicRoutes: ["/", "/auth/login(.*)", "/auth/signup(.*)"],
});

export const config = {
  matcher: [
    "/((?!_next|static|.*\\..*|favicon.ico).*)",
  ],
};
