import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

/**
 * Module 1: The Cloudinary "One-Touch" Upload Engine
 * With Supabase Fallback logic.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME";
  const uploadPreset = "pos_unsigned_uploads";
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Cloudinary upload failed");

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.warn("Cloudinary Error, falling back to Supabase:", error);
    
    // Fallback: Upload compressed version to Supabase
    try {
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${fileExt}`;
      const { error: sbError } = await supabase.storage
        .from('product-images')
        .upload(`fallback/${fileName}`, compressedFile);

      if (sbError) throw sbError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(`fallback/${fileName}`);
      return data.publicUrl;
    } catch (sbError) {
      console.error("Supabase Fallback also failed:", sbError);
      throw new Error("All upload methods failed.");
    }
  }
}
