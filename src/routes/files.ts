import Elysia, { t } from "elysia";
import { auth } from "@/src/middleware/auth";
import { fileIdSchema, fileUploadSchema } from "@/src/schema";
import {
	deleteFile,
	getFile,
	getStoragePercentage,
	saveFile,
} from "@/src/utils/storage";
import { db } from "@/src/db";
import { files } from "@/src/db/schema";
import { eq } from "drizzle-orm";

const MAX_FILE_SIZE: number = 50 * 1024 * 1024; // 50MB

export const fileRoutes = new Elysia()
	.use(auth)
	.post(
		"/upload",
		async ({ body, user }) => {
			if (!user) throw new Error("Unauthorized");

			const validatedBody = fileUploadSchema.parse(body);
			const { file, filename, category } = validatedBody;

			if (file.size > MAX_FILE_SIZE) {
				throw new Error("File size exceeds the maximum limit");
			}

			const path = await saveFile(file.buffer, filename, category);
			const newFile = await db.insert(files).values({
				userId: user.id,
				filename,
				category,
				path,
			});

			const [savedFile] = await db
				.select()
				.from(files)
				.where(eq(files.id, newFile.insertId))
				.limit(1);

			if (!savedFile) {
				throw new Error("Failed to save file");
			}

			return { message: "File uploaded successfully", file: savedFile };
		},
		{
			body: t.Object({
				file: t.Any(),
				filename: t.String(),
				category: t.String(),
			}),
		},
	)
	.get("/download/:id", async ({ params, user }) => {
		if (!user) throw new Error("Unauthorized");

		const { id } = fileIdSchema.parse(params);

		const [file] = await db
			.select()
			.from(files)
			.where(eq(files.id, id))
			.limit(1);
		if (!file) throw new Error("File not found");

		const fileContent: Buffer | ArrayBuffer | Uint8Array = await getFile(
			file.path,
		);
		return new Response(fileContent, {
			headers: {
				"Content-Disposition": `attachment; filename="${file.filename}"`,
				"Content-Type": "application/octet-stream",
			},
		});
	})
	.delete("/delete/:id", async ({ params, user }) => {
		if (!user || !user.isAdmin) throw new Error("Unauthorized");

		const { id } = fileIdSchema.parse(params);

		const [file] = await db
			.select()
			.from(files)
			.where(eq(files.id, id))
			.limit(1);
		if (!file) throw new Error("File not found");

		await deleteFile(file.path);
		await db.delete(files).where(eq(files.id, id));

		return { message: "File deleted successfully" };
	})
	.get("/storage-percentage", async ({ user }) => {
		if (!user || !user.isAdmin) throw new Error("Unauthorized");

		const percentage = await getStoragePercentage();
		return { percentage: percentage.toFixed(2) };
	});
