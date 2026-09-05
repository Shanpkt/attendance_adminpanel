import { supabase } from "../configu/superbase";

export const STORAGE_BUCKET = "ATTENDANCE";

const isFolder = (item) => {
  return (
    item?.id == null ||
    item?.metadata == null ||
    !item?.metadata?.mimetype
  );
};

export const getStoragePathFromPublicUrl = (publicUrl) => {
  if (!publicUrl) {
    return "";
  }

  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);

  if (index === -1) {
    return "";
  }

  return decodeURIComponent(
    publicUrl.slice(index + marker.length).split("?")[0]
  );
};

export const listStorageFiles = async (prefix = "") => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(prefix || "", {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    throw new Error(
      error.message || "Unable to list storage files."
    );
  }

  const files = [];

  for (const item of data || []) {
    if (!item?.name || item.name === ".emptyFolderPlaceholder") {
      continue;
    }

    const path = prefix ? `${prefix}/${item.name}` : item.name;

    if (isFolder(item)) {
      try {
        const nested = await listStorageFiles(path);

        if (
          nested.length > 0 ||
          item.id == null ||
          item.metadata == null
        ) {
          files.push(...nested);
          continue;
        }
      } catch (nestedError) {
        console.error("Storage folder list error:", nestedError);
      }
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    files.push({
      name: item.name,
      path,
      folder: prefix || "root",
      size: item.metadata?.size || 0,
      createdAt: item.created_at || item.updated_at || "",
      publicUrl: urlData?.publicUrl || "",
    });
  }

  return files;
};

export const listAllStorageFiles = async () => {
  const folders = ["", "pending", "profilepic"];
  const byPath = new Map();

  for (const folder of folders) {
    const nested = await listStorageFiles(folder);
    nested.forEach((file) => {
      byPath.set(file.path, file);
    });
  }

  return [...byPath.values()];
};

export const listPendingFiles = async () => {
  return listStorageFiles("pending");
};

export const deleteStorageFiles = async (paths) => {
  const uniquePaths = [...new Set((paths || []).filter(Boolean))];

  if (uniquePaths.length === 0) {
    return [];
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(uniquePaths);

  if (error) {
    throw new Error(
      error.message || "Unable to delete storage files."
    );
  }

  return data;
};

export const formatFileSize = (bytes) => {
  const size = Number(bytes) || 0;

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
