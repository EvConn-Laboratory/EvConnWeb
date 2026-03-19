"use client";

import { useState } from "react";
import { Image as ImageIcon, Search, Upload, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/FileUpload";

interface GalleryItem {
  id: string;
  title: string | null;
  filePath: string;
}

interface ImagePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  galleryItems: GalleryItem[];
}

export function ImagePicker({ value, onChange, galleryItems }: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = galleryItems.filter((item) =>
    (item.title || "").toLowerCase().includes(search.toLowerCase()) ||
    item.filePath.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center border border-border">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {value ? value.split("/").pop() : "No image selected"}
          </p>
          <div className="mt-2 flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="xs" variant="outline" className="h-7 text-[10px] gap-1">
                  <Search className="h-3 w-3" />
                  Choose from Gallery
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Select Image</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="gallery" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="gallery">Gallery</TabsTrigger>
                    <TabsTrigger value="upload">Upload New</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="gallery" className="space-y-4">
                    <div className="relative mt-2">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        placeholder="Search gallery..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onChange(item.filePath);
                            setOpen(false);
                          }}
                          className={cn(
                            "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02]",
                            value === item.filePath ? "border-primary" : "border-border hover:border-primary/50"
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.filePath}
                            alt={item.title || ""}
                            className="h-full w-full object-cover"
                          />
                          {value === item.filePath && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                      {filteredItems.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground italic text-sm">
                          No images found.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="upload">
                    <div className="py-4">
                      <FileUpload
                        category="gallery"
                        onUploadComplete={(path) => {
                          onChange(path);
                          setOpen(false);
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Button
              size="xs"
              variant="ghost"
              type="button"
              className="h-7 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-500/10"
              onClick={() => onChange(null)}
              disabled={!value}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <input type="hidden" name="profilePhotoPath" value={value || ""} />
    </div>
  );
}
