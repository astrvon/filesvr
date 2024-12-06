import { writeFile, unlink, stat } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = ".\\filestorage";

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
    throw new Error(err instanceof Error ? err.message : undefined);
  }
};

export const deleteFile: (path: string) => Promise<void> = async (
  path: string,
): Promise<void> => {
  await unlink(path);
};

export const getStorageUsage = async () => {
  const { size, blocks } = await stat(UPLOAD_DIR);
  const usedSpace: number = blocks * 512; // convert from blocks to bytes
  const totalSpace: number = size;
  const usagePercentage: number = (usedSpace / totalSpace) * 100;
  const freeSpace: number = size * usagePercentage;
  console.log({
    stat: await stat(UPLOAD_DIR),
    size,
    blocks,
    usedSpace,
    totalSpace,
    usagePercentage,
    freeSpace,
  });
  return { usagePercentage, usedSpace, totalSpace, freeSpace };
};
