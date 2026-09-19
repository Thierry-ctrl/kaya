import { useState, useRef, useId } from "react";
import { Button } from "@/components/ui/button";
import { useCreateMediaUploadUrl, useCompleteMediaUpload, MediaUploadInputContentType } from "@workspace/api-client-react";
import { Loader2, UploadCloud, X } from "lucide-react";
import { resolveStorefrontImage } from "@/hooks/use-storefront";

export function ImageUpload({ 
  value, 
  onChange, 
  disabled 
}: { 
  value: string; 
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputId = useId();
  
  const createUploadUrl = useCreateMediaUploadUrl();
  const completeUpload = useCompleteMediaUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Only JPG, PNG, and WEBP are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size < 1 || file.size > 5 * 1024 * 1024) {
      alert("Choose an image no larger than 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      
      const target = await createUploadUrl.mutateAsync({
        data: {
          contentType: file.type as MediaUploadInputContentType,
          size: file.size
        }
      });
      
      const uploadResponse = await fetch(target.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      if (!uploadResponse.ok) throw new Error("Image upload was rejected by storage.");
      
      const result = await completeUpload.mutateAsync({
        data: {
          uploadId: target.uploadId
        }
      });
      
      onChange(result.url);
      
    } catch (error) {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={urlInputId} className="block text-sm font-medium">Image URL</label>
        <input
          id={urlInputId}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || isUploading}
          placeholder="/images/… or https://…"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">Use an approved HTTPS image or upload a JPEG, PNG or WebP up to 5 MB.</p>
      </div>
      {value ? (
        <div className="relative inline-block border border-border rounded-xl overflow-hidden group bg-muted/50 p-2">
          <img src={resolveStorefrontImage(value)} alt="Preview" className="h-40 w-auto object-contain rounded-lg" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-4 right-4 p-1.5 bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-foreground backdrop-blur rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
            disabled={disabled}
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}
      
      <div className="flex items-center gap-4">
        <input 
          type="file" 
          accept="image/jpeg, image/png, image/webp" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="bg-card"
        >
          {isUploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
          ) : (
            <><UploadCloud className="w-4 h-4 mr-2" /> Select Image</>
          )}
        </Button>
        {isUploading && <span className="text-sm font-medium text-muted-foreground">Please wait...</span>}
      </div>
    </div>
  );
}
