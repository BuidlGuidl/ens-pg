import { getSession } from "next-auth/react";

export const hasActiveUserSession = async () => {
  const session = await getSession();
  return Boolean(session?.user?.address);
};

export const hasActiveAdminSession = async () => {
  const session = await getSession();
  return Boolean(session?.user?.address) && session?.user?.role === "admin";
};
