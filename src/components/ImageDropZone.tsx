import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";

interface ImageDropZoneProps {
  onImageLoad: (img: HTMLImageElement) => void;
}

function ImageDropZone({ onImageLoad }: ImageDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => onImageLoad(img);
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={`card border-2 border-dashed cursor-pointer transition-colors ${
        isDragOver
          ? "border-primary bg-primary/10"
          : "border-base-content/20 hover:border-primary/50"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <div className="card-body items-center text-center py-8">
        <Upload className="h-10 w-10 opacity-40" />
        <p className="text-sm opacity-60 mt-2">{fileName}</p>
        <p className="text-xs opacity-40">PNG, JPG, WEBP</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}

export default ImageDropZone;
