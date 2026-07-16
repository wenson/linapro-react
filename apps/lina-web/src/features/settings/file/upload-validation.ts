const maxBytes = 20 * 1024 * 1024;
export function validateManagedUpload(file: Pick<File, "size" | "type">, imageOnly: boolean): "imageOnly" | "tooLarge" | null { if (file.size > maxBytes) return "tooLarge"; if (imageOnly && !file.type.startsWith("image/")) return "imageOnly"; return null; }
