import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      hasProfile: boolean;
    };
  }

  interface User {
    hasProfile?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    hasProfile: boolean;
  }
}
