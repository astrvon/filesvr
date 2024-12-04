import { Elysia, Context } from "elysia";
import { verifyToken } from "../utils/jwt";

export const authMiddleware = async (context: Context) => {
  console.log(context.request.headers["authorization"]);
  const token = context.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new Error("No token provided");
  }
  try {
    const user = await verifyToken(token);
    return { user };
  } catch (err) {
    context.set.status = 401;
    throw new Error("Invalid token");
  }
};

export const adminMiddleware = (context: Context) => {
  if (!context["user"].data.isAdmin) {
    context.set.status = 403;
    throw new Error("Admin access required");
  }
};
