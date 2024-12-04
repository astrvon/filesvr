import Elysia from "elysia";
import { ZodError } from "zod";

export const errorHandler = new Elysia().onError(({ code, error, set }) => {
	console.error(
		`Error ${code}: ${error instanceof ZodError ? error.errors : error instanceof Error ? error.message : error}`,
	);

	if (error instanceof ZodError) {
		set.status = 400;
		return {
			error: true,
			message: "Validation error",
			details: error.errors,
		};
	}

	if (error instanceof Error) {
		set.status = 400;
		return {
			error: true,
			message: error.message,
		};
	}

	set.status = code === "NOT_FOUND" ? 404 : 500;
	return {
		error: true,
		message: error,
	};
});
