import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      hasProfile: boolean;
      role: "USER" | "ADMIN";
    };
  }

  interface User {
    hasProfile?: boolean;
    role?: "USER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    hasProfile: boolean;
    role: "USER" | "ADMIN";
  }
}
