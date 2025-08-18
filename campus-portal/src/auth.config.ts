const config = {
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }: any) {
      const nextUrl = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ["/dashboard", "/api/complaints"];
      const isProtected = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));
      if (!isProtected) return true;
      return isLoggedIn;
    },
  },
} as const;

export default config;

