import { writeFile, unlink, stat, readdir } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = ".\\filestorage\\";

export const uploadFile: (file: File) => Promise<{
  filename: string;
  path: string;
}> = async (
  file: File,
): Promise<{
  filename: string;
  path: string;
}> => {
  const filename = `${Date.now()}-${file?.name}`;
  const path: string = join(UPLOAD_DIR, filename);

  try {
    await writeFile(path, file.stream());
    return { filename, path };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : err);
  }
};

export const deleteFile: (path: string) => Promise<void> = async (
  path: string,
): Promise<void> => {
  await unlink(path);
};

export const getStorageUsage: () => Promise<{
  usagePercentage: number;
  totalSize: number;
  totalSpace: number;
}> = async (): Promise<{
  usagePercentage: number;
  totalSize: number;
  totalSpace: number;
}> => {
  const files: string[] = await readdir(UPLOAD_DIR);
  let totalSize: number = 0;
  for (const file of files) {
    const { size } = await stat(join(UPLOAD_DIR, file));
    totalSize += size;
  }
  const totalSpace: number = 10 * 1024 * 1024 * 1024; // 10GB
  const usagePercentage: number = (totalSize / totalSpace) * 100;
  return { usagePercentage, totalSize, totalSpace };
};
