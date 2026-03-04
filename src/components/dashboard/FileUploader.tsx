"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface FileUploaderProps {
  onUpload: (url: string) => void;
  accept?: string;
  folder?: string;
  currentUrl?: string | null;
  label?: string;
  aspect?: "video" | "square";
}

export function FileUploader({
  onUpload,
  accept = "image/*",
  folder = "",
  currentUrl,
  label = "Subir archivo",
  aspect = "video",
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "media");
    formData.append("folder", folder);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        onUpload(url);
        setPreview(url);
      }
    } catch {
      // handle error silently for now
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors ${
        aspect === "video" ? "aspect-video" : "aspect-square"
      }`}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt=""
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => {
              setPreview(null);
              onUpload("");
            }}
            className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white/60 hover:text-white"
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/50 transition-colors"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <Upload size={24} />
              <span className="text-xs">{label}</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
