import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

/**
 * Task 1: Client-Side Image Compression & Upload Engine
 * Compresses to <300KB and uploads to Cloudinary with Supabase Fallback.
 */
export async function uploadCompressedToCloudinary(file: File): Promise<string> {
  // 1. Compression Config
  const compressionOptions = {
    maxSizeMB: 0.3, // 300KB
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    
    // 2. Cloudinary Config
    const cloudName = "dhf58zsoq";
    const uploadPreset = "pos_unsigned_uploads";
    
    const formData = new FormData();
    formData.append("file", compressedFile);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Cloudinary upload failed");

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.warn("Media Engine: Falling back to Supabase due to Cloudinary error.");
    
    // Fallback: Still compressed to Supabase
    try {
      const compressedFile = await imageCompression(file, compressionOptions);
      const fileName = `${uuidv4()}.jpg`;
      const { error: sbError } = await supabase.storage
        .from('product-images')
        .upload(`variants/${fileName}`, compressedFile);

      if (sbError) throw sbError;
      const { data } = supabase.storage.from('product-images').getPublicUrl(`variants/${fileName}`);
      return data.publicUrl;
    } catch (sbError) {
      console.error("Critical: All media upload paths failed.");
      throw new Error("Media upload failure.");
    }
  }
}
