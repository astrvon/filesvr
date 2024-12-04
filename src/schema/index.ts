import { z } from "zod";

const passwordRegex: RegExp = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[A-Z]).{6,}$/;

export const userSchema = z.object({
	username: z
		.string()
		.min(3, "Username can't be less than 3 characters")
		.max(50, "Username is too long"),
	password: z
		.string()
		.min(8, "Password can't be less than 8 characters")
		.regex(
			passwordRegex,
			"Password must contain at least one number, one symbol, and one uppercase letter",
		),
});

export const fileUploadSchema = z.object({
	file: z.any(),
	filename: z
		.string()
		.min(1, "Filename can't be empty")
		.max(255, "Filename is too long"),
	category: z.enum([
		"idcard",
		"selfie",
		"prospectus",
		"fundsheet",
		"signature",
	]),
});

export const fileIdSchema = z.object({
	id: z.string().uuid(),
});
