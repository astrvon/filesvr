import { readFile, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const STORAGE_PATH: string | undefined = Bun.env.STORAGE_PATH;
if (!STORAGE_PATH) throw new Error("Storage path must be defined");

export async function saveFile(
	file: Buffer | ArrayBuffer | Uint8Array,
	filename: string,
	category: string,
): Promise<string> {
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const path: string = join(STORAGE_PATH!, category, filename);
	await writeFile(path, file);
	return path;
}

export async function deleteFile(path: string): Promise<void> {
	await unlink(path);
}

export async function getFile(path: string): Promise<Buffer> {
	return await readFile(path);
}

export async function getStoragePercentage(): Promise<number> {
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const { size, blocks } = await stat(STORAGE_PATH!);
	const usedSpace: number = blocks * 512;
	const totalSpace: number = size;
	return (usedSpace / totalSpace) * 100;
}
