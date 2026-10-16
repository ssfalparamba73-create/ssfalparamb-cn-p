"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdminPublicBanner, uploadPublicBanner } from "@/lib/api/settingsClient";
import type { PublicBannerDTO } from "@/lib/backend/dto/publicBanner.dto";
import { clearQueries } from "@/lib/client/queryCache";
import { setAppQueryData } from "@/lib/client/appQueryClient";
import { useAuth } from "@/lib/admin/AuthContext";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Unable to read this image."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function PublicBannerManager() {
  const { currentUser } = useAuth();
  const canUpdate = currentUser?.permissions.includes("settings.update") ?? false;
  const inputRef = useRef<HTMLInputElement>(null);
  const [banner, setBanner] = useState<PublicBannerDTO | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAdminPublicBanner()
      .then((value) => { if (active) setBanner(value); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load the banner.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const chooseFile = async (file?: File) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    try {
      const imageSize = await readImageDimensions(file);
      const ratio = imageSize.width / imageSize.height;
      if (Math.abs(ratio - 16 / 9) > 0.03) {
        toast.error("Use a 16:9 image. Recommended size: 1600 × 900 px.");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setDimensions(`${imageSize.width} × ${imageSize.height} px`);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (imageError) {
      toast.error(imageError instanceof Error ? imageError.message : "Unable to read this image.");
    }
  };

  const save = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const uploaded = await uploadPublicBanner(selectedFile);
      setBanner(uploaded);
      setSelectedFile(null);
      setDimensions(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      clearQueries("admin:api:/api/v1/admin/settings/public-banner");
      setAppQueryData(["public", "dashboard-banner"], uploaded);
      toast.success("Dashboard banner updated successfully.");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Unable to upload the banner.");
    } finally {
      setIsSaving(false);
    }
  };

  const imageUrl = previewUrl ?? banner?.url ?? "/social/ssf-alparamba-share.png";

  return (
    <Card className="max-w-4xl overflow-hidden border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            {isLoading ? (
              <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-800" />
            ) : (
              <Image src={imageUrl} alt="Member dashboard banner preview" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
            )}
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p>}
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
            <ImageIcon className="size-5" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-50">Upload a new banner</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Recommended: 1600 × 900 px (16:9). JPG, PNG, or WebP. Maximum 5 MB.
          </p>
          {!canUpdate && (
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
              Settings update permission is required to replace this image.
            </p>
          )}
          {selectedFile && (
            <p className="mt-3 break-all text-sm font-medium text-slate-700 dark:text-slate-300">
              {selectedFile.name}{dimensions ? ` · ${dimensions}` : ""}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => void chooseFile(event.target.files?.[0])}
          />
          <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={isSaving || !canUpdate}>
              <Upload className="size-4" /> Choose image
            </Button>
            <Button type="button" onClick={() => void save()} disabled={!selectedFile || isSaving || !canUpdate} className="bg-blue-600 text-white hover:bg-blue-700">
              {isSaving ? "Uploading..." : "Save banner"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
