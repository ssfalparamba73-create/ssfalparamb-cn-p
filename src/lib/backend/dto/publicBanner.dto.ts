import type { ISODateTime } from "../contracts/common.contract";

export interface PublicBannerDTO {
  source: "storage" | "fallback";
  bucket?: "unit-assets";
  path: string;
  url: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  checksum?: string;
  updatedAt?: ISODateTime;
}

