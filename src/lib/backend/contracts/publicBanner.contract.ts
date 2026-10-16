import type { ActorContext, BackendResult } from "./common.contract";
import type { PublicBannerDTO } from "../dto/publicBanner.dto";

export interface PublicBannerUploadInput {
  bytes: Uint8Array;
  mimeType: string;
  originalName: string;
}

export interface PublicBannerRepository {
  getActive(): Promise<PublicBannerDTO | null>;
  upload(input: PublicBannerUploadInput): Promise<PublicBannerDTO>;
  activate(banner: PublicBannerDTO, actor: ActorContext): Promise<PublicBannerDTO>;
  remove(banner: PublicBannerDTO): Promise<void>;
}

export interface PublicBannerService {
  getPublicBanner(): Promise<BackendResult<PublicBannerDTO>>;
  getAdminBanner(actor: ActorContext): Promise<BackendResult<PublicBannerDTO>>;
  uploadBanner(input: PublicBannerUploadInput, actor: ActorContext): Promise<BackendResult<PublicBannerDTO>>;
}

