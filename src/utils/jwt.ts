import { JWTPayload, SignJWT, jwtVerify } from "jose";

const secret: Uint8Array = new TextEncoder().encode(process.env.JWT_SECRET);

export const generateToken: (user: any) => Promise<string> = (
  user: any,
): Promise<string> => {
  return new SignJWT({ id: user.id, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(secret);
};

export const verifyToken: (token: string) => Promise<JWTPayload> = async (
  token: string,
): Promise<JWTPayload> => {
  const { payload } = await jwtVerify(token, secret);
  console.log(payload);
  return payload;
};
