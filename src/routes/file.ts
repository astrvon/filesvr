import { Elysia, t } from "elysia";
import { db } from "../db";
import { files } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { uploadFile, deleteFile, getStorageUsage } from "../utils/fileHandler";
import { readFile } from "fs/promises";

export type TUser = {
  id: string;
  isAdmin: boolean;
};

class User {
  constructor(
    public data: TUser = {
      id: "9972ad30-8bb8-4628-ab2c-bc8fd3a7cf94",
      isAdmin: true,
    },
  ) {}
}

export const fileRoutes = new Elysia({ prefix: "/files" })
  .decorate("user", new User())
  .onTransform(function log({ body, params, path, request: { method } }) {
    console.log(`${method} ${path}`, {
      body,
      params,
    });
  })
  .post(
    "/upload",
    async ({ body, user, set }) => {
      const { file, category } = body;

      try {
        const { filename, path } = await uploadFile(file);
        const newFile = await db
          .insert(files)
          .values({
            filename,
            path,
            category,
            userId: user.data.id,
          })
          .returning();
        return { message: "File uploaded successfully", file: newFile[0] };
      } catch (err) {
        set.status = err instanceof Error ? 400 : 500;
        return {
          code: err instanceof Error ? 400 : 500,
          message: err instanceof Error ? err.message : err,
        };
      }
    },
    {
      body: t.Object({
        file: t.File(),
        category: t.Optional(t.String()),
      }),
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
        return await readFile(`.\\${file[0].path}`);
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
          return { message: "File not found" };
        }
        await deleteFile(`.\\${deleteFile[0].path}`);
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
      beforeHandle: [adminMiddleware],
      params: t.Object({
        id: t.String(),
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
      return { usage };
    },
    {
      beforeHandle: [adminMiddleware],
      detail: {
        tags: ["File"],
      },
      security: [{ bearerAuth: [] }],
    },
  );
