import { supabase } from "../configu/superbase";

const STORAGE_BUCKET = "ATTENDANCE";
const PROFILE_FOLDER = "profilepic";

const getExtension = (file) => {
  const mime = String(file?.type || "").toLowerCase();

  if (mime.includes("png")) {
    return "png";
  }

  if (mime.includes("webp")) {
    return "webp";
  }

  if (mime.includes("gif")) {
    return "gif";
  }

  return "jpg";
};

export const uploadProfilePic = async (file, employeeId) => {
  if (!(file instanceof File)) {
    throw new Error("Please choose a photo from your device.");
  }

  const mime = file.type || "image/jpeg";

  if (!mime.startsWith("image/")) {
    throw new Error("Only image files can be uploaded.");
  }

  const safeId = String(employeeId || "pending").replace(
    /[^a-zA-Z0-9_-]/g,
    ""
  );

  const fileName = `${PROFILE_FOLDER}/${safeId || "pending"}/${Date.now()}.${getExtension(file)}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      contentType: mime,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase profile upload error:", error);
    throw new Error(
      error.message || "Unable to upload profile photo."
    );
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error(
      "Photo uploaded but no public URL was returned."
    );
  }

  return {
    publicUrl: urlData.publicUrl,
    path: data.path,
  };
};

const getStoragePathFromPublicUrl = (publicUrl) => {
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

const normalizeStoragePath = (publicUrl, storagePath) => {
  const rawPath =
    storagePath || getStoragePathFromPublicUrl(publicUrl);

  return String(rawPath || "")
    .replace(new RegExp(`^${STORAGE_BUCKET}/`), "")
    .replace(/^\/+/, "");
};

export const deleteProfilePic = async (publicUrl, storagePath) => {
  const path = normalizeStoragePath(publicUrl, storagePath);

  if (!path) {
    return [];
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error("Supabase profile delete error:", error);
    throw new Error(
      error.message || "Unable to delete profile photo."
    );
  }

  return data;
};
