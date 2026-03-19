"use client";

import { useState, useRef } from "react";
import { Upload, X, File, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onUploadComplete?: (filePath: string) => void;
  category?: "gallery" | "materials" | "submissions";
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  category = "gallery",
  accept = "image/*",
  maxSize = 10,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (f: File) => {
    setError(null);
    setSuccess(false);
    
    // Check file type
    const mimeMatch = accept.split(",").some((a) => {
      const pattern = a.replace("*", ".*").trim();
      return f.type.match(new RegExp(pattern));
    });
    
    if (accept !== "*" && !mimeMatch) {
      setError(`Invalid file type. Accepted: ${accept}`);
      return;
    }

    if (f.size > maxSize * 1024 * 1024) {
      setError(`File too large. Max: ${maxSize}MB`);
      return;
    }

    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Upload failed");

      setSuccess(true);
      if (onUploadComplete) onUploadComplete(result.filePath);
      
      // Clear after success
      setTimeout(() => {
        setFile(null);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-3",
          isDragging
            ? "border-primary bg-primary/5 scale-[0.98]"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          file && "border-primary/50 bg-primary/5"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
          accept={accept}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <File className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Click or drag to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept.replace("/*", "")} up to {maxSize}MB
              </p>
            </div>
          </>
        )}

        {file && !uploading && !success && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {error}
        </p>
      )}

      {file && !success && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleUpload();
          }}
          disabled={uploading}
          className="w-full h-10 gap-2 font-semibold"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Start Upload"}
        </Button>
      )}

      {success && (
        <div className="flex items-center justify-center gap-2 py-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Upload successful!</span>
        </div>
      )}
    </div>
  );
}
