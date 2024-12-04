import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "@/src/routes/auth";
import { fileRoutes } from "@/src/routes/files";
import { errorHandler } from "@/src/middleware/errorHandler";

const app = new Elysia()
	.use(cors())
	.use(errorHandler)
	.use(authRoutes)
	.use(fileRoutes)
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
