"use client";

import React, { useState } from "react";
import Image from "next/image";
interface ImageUploadProps {
  onImageUploaded: (imagePath: string) => void;
  currentImage?: string | null;
}

export default function ImageUpload({
  onImageUploaded,
  currentImage,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);

  // Load existing image on mount
  React.useEffect(() => {
    if (currentImage && window.electronAPI) {
      loadImage(currentImage);
    }
  }, [currentImage]);

  const loadImage = async (imagePath: string) => {
    try {
      const result = await window.electronAPI.getImage(imagePath);
      if (result && result.exists) {
        setImageData(result.data);
        setPreview(result.data);
      }
    } catch (error) {
      console.error("Error loading image:", error);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Electron
      if (window.electronAPI) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await window.electronAPI.uploadImage({
          name: file.name,
          buffer: buffer,
        });

        if (result.success) {
          console.log("Image uploaded successfully:", result.path);
          onImageUploaded(result.path);
        } else {
          console.error("Upload failed:", result);
          alert("Failed to upload image");
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    setImageData(null);
    onImageUploaded("");
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Product Image
      </label>

      {preview || imageData ? (
        <div className="relative">
          <Image
            src={preview || imageData || ""}
            alt="Product preview"
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
            width={128}
            height={128}
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <label htmlFor="image-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500">
                  Upload an image
                </span>
                <input
                  id="image-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="text-sm text-blue-600">Uploading image...</div>
      )}
    </div>
  );
}
