import { Elysia, Context } from "elysia";
import { verifyToken } from "../utils/jwt";
import { JWTPayload } from "jose";

export const authMiddleware = async (context: Context): Promise<void> => {
  const token: string | undefined =
    context.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new Error("No token provided");
  }
  try {
    const user: JWTPayload = await verifyToken(token);
    context.store = { user };
  } catch (err) {
    context.set.status = 401;
    throw new Error("Invalid token");
  }
};

export const adminMiddleware = (context: Context): void => {
  if (!context.store.user.isAdmin) {
    context.set.status = 403;
    throw new Error("Admin access required");
  }
};
