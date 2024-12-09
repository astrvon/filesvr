import { Elysia, t } from "elysia";
import { db } from "../db";
import { files } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { uploadFile, deleteFile, getStorageUsage } from "../utils/fileHandler";
import { readFile } from "fs/promises";

export const fileRoutes = new Elysia({ prefix: "/files" })
	.onTransform(function log({ body, params, path, request: { method } }) {
		console.log(`${method} ${path}`, {
			body,
			params,
		});
	})
	.post(
		"/upload",
		async ({ body, set }) => {
			const { file, category, userId } = body;

			try {
				if (!file) throw new Error("File can't be empty");
				switch (category) {
					case "ktp":
					case "selfie":
					case "prospectus":
					case "fundsheet":
					case "signature":
						break;
					default:
						throw new Error("Category is not on the list");
				}

				const { filename, path } = await uploadFile(file, category);
				const newFile = await db
					.insert(files)
					.values({
						filename,
						path,
						category,
						userId,
					})
					.returning();
				return { message: "File uploaded successfully", file: newFile[0] };
			} catch (err) {
				set.status = err instanceof Error ? 400 : 500;
				return {
					code: err instanceof Error ? 400 : 500,
					message: err instanceof Error ? (err as Error).message : err,
				};
			}
		},
		{
			body: t.Object(
				{
					file: t.File({
						error: { code: 422, message: "File can't be empty" },
					}),
					category: t.String({
						error: { code: 422, message: "Category must be selected" },
					}),
					userId: t.String({
						error: { code: 422, message: "User ID can't be empty" },
					}),
				},
				{ error: { code: 422, message: "Invalid content type" } },
			),
			detail: {
				tags: ["File"],
			},
		},
	)
	.get(
		"/download/:id",
		async ({ params, set }) => {
			const { id } = params;

			try {
				const file = await db
					.select()
					.from(files)
					.where(eq(files.id, id))
					.limit(1);
				if (file.length === 0) {
					set.status = 404;
					return { message: "File not found" };
				}

				set.headers["content-disposition"] =
					`attachment; filename="${file[0].filename}"`;
				set.headers["content-type"] = "application/octet-stream";
				return await readFile(`${file[0].path}`);
			} catch (err) {
				set.status = err instanceof Error ? 400 : 500;
				return {
					code: err instanceof Error ? 400 : 500,
					message: err instanceof Error ? err.message : err,
				};
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			detail: {
				tags: ["File"],
			},
		},
	)
	.delete(
		"/:id",
		async ({ params, set }) => {
			const { id } = params;

			try {
				const deletedFile = await db
					.delete(files)
					.where(eq(files.id, id))
					.returning();
				if (deletedFile.length === 0) {
					set.status = 404;
					throw new Error("File not found");
				}
				await deleteFile(`.\\${deletedFile[0].path}`);
				return { message: "File deleted successfully", file: deletedFile[0] };
			} catch (err) {
				set.status = err instanceof Error ? 400 : 500;
				return {
					code: err instanceof Error ? 400 : 500,
					message: err instanceof Error ? err.message : err,
				};
			}
		},
		{
			beforeHandle: [authMiddleware, adminMiddleware],
			params: t.Object({
				id: t.String({
					error:
						"I see the param was empty, have you make sure this is the right method?",
				}),
			}),
			detail: {
				tags: ["File"],
			},
			security: [{ bearerAuth: [] }],
		},
	)
	.get(
		"/storage",
		async () => {
			const usage = await getStorageUsage();
			return {
				usagePercentage: usage.usagePercentage,
				usedSpace: formatBytes(usage.usedSpace),
				totalSpace: formatBytes(usage.totalSpace),
				availableSpace: formatBytes(usage.availableSpace),
			};
		},
		{
			beforeHandle: [authMiddleware, adminMiddleware],
			detail: {
				tags: ["File"],
			},
			security: [{ bearerAuth: [] }],
		},
	);

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 byte";
	const k: number = 1024;
	const size: Array<string> = ["B", "KB", "MB", "GB", "TB"];
	const i: number = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${size[i]}`;
}
