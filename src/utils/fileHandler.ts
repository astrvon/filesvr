import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { promisify } from "util";

const UPLOAD_DIR: string | undefined = Bun.env.UPLOAD_DIR;

const execAsync = promisify(require("child_process").exec);

export const uploadFile: (
	file: File,
	category: string,
) => Promise<{
	filename: string;
	path: string;
}> = async (
	file: File,
	category: string,
): Promise<{
	filename: string;
	path: string;
}> => {
	const filename = `${Date.now()}-${file?.name}`;
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const path: string = join(UPLOAD_DIR!, category, filename);

	try {
		await writeFile(path, file.stream());
		return { filename, path };
	} catch (err) {
		throw new Error(err instanceof Error ? err.message : undefined);
	}
};

export const deleteFile: (path: string) => Promise<void> = async (
	path: string,
): Promise<void> => {
	await unlink(path);
};

export const getStorageUsage = async (): Promise<{
	usagePercentage: string | number;
	totalSpace: number;
	usedSpace: number;
	availableSpace: number;
}> => {
	try {
		const { stdout } = await execAsync(`df -B1 ${UPLOAD_DIR}`);
		// biome-ignore lint/suspicious/noExplicitAny: explicitly defined as any
		const lines: any = stdout.trim().split("\n");

		const [, info] = lines;
		const [, totalSpace, usedSpace, availableSpace] = info
			.split(/\s+/)
			.map(Number);

		const usagePercentage: number = (usedSpace / totalSpace) * 100;

		return {
			usagePercentage,
			totalSpace,
			usedSpace,
			availableSpace,
		};
	} catch (err) {
		console.error("Error getting storage usage:", err);
		throw err;
	}
};
