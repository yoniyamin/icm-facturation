"use client";

import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";

interface CameraCaptureProps {
  onImageCaptured: (imageDataUrl: string) => void;
}

function compressImage(
  file: File,
  maxWidth: number = 1600,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function CameraCapture({ onImageCaptured }: CameraCaptureProps) {
  const t = useTranslations();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert(t("errors.invalidImage"));
        return;
      }

      setIsProcessing(true);
      try {
        const compressed = await compressImage(file);
        setPreview(compressed);
      } catch {
        alert(t("errors.invalidImage"));
      } finally {
        setIsProcessing(false);
      }
    },
    [t]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleConfirm = () => {
    if (preview) {
      onImageCaptured(preview);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (preview) {
    return (
      <div className="flex flex-1 flex-col items-center gap-4">
        <div className="overflow-hidden rounded-2xl border-2 border-primary-200 shadow-lg">
          <img
            src={preview}
            alt="Receipt preview"
            className="max-h-[50vh] w-full object-contain"
          />
        </div>
        <div className="flex w-full gap-3">
          <button
            onClick={handleRetake}
            className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            {t("preview.retake")}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-accent-400 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-accent-500 active:bg-accent-600"
          >
            {t("preview.continue")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
          <Camera className="h-10 w-10 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-primary-900">
          {t("app.scanReceipt")}
        </h2>
      </div>

      <div className="flex w-full flex-col gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isProcessing}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-accent-400 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-accent-500 active:scale-[0.98] active:bg-accent-600 disabled:opacity-50"
        >
          <Camera className="h-5 w-5" />
          {t("app.takePhoto")}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-warm-300" />
          <span className="text-sm text-gray-400">{t("app.or")}</span>
          <div className="h-px flex-1 bg-warm-300" />
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary-300 bg-white px-6 py-4 text-base font-semibold text-primary-700 transition-all hover:border-primary-400 hover:bg-primary-50 active:scale-[0.98] disabled:opacity-50"
        >
          <Upload className="h-5 w-5" />
          {t("app.uploadImage")}
        </button>
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-400 border-t-transparent" />
          {t("ocr.processing")}
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <ImageIcon className="h-4 w-4" />
        <span>JPG, PNG, HEIC</span>
      </div>
    </div>
  );
}
