import type { AuditRepository } from "../contracts/admin.contract";
import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type { PublicBannerRepository, PublicBannerService } from "../contracts/publicBanner.contract";
import type { PublicBannerDTO } from "../dto/publicBanner.dto";
import { createBackendError, permissionError, validationError } from "../errors/createBackendError";
import { ERROR_CODES } from "../errors/errorCodes";
import { fail, fromThrowable, ok } from "../errors/resultHelpers";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const FALLBACK: PublicBannerDTO = {
  source: "fallback",
  path: "/social/ssf-alparamba-share.png",
  url: "/social/ssf-alparamba-share.png",
  mimeType: "image/png",
  sizeBytes: 139586,
};

function signatureMatches(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/png") return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/webp") return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  return false;
}

export function createPublicBannerService(deps: {
  repository: PublicBannerRepository;
  auditRepository: AuditRepository;
}): PublicBannerService {
  const read = async () => (await deps.repository.getActive()) ?? FALLBACK;
  const requireAdmin = (actor: ActorContext, allowedPermissions: string[]): BackendResult<true> => {
    if (actor.actorType !== "admin" || !actor.adminId) return fail(permissionError("Admin access required."));
    if (!allowedPermissions.some((permission) => actor.permissions?.includes(permission))) {
      return fail(permissionError(`Permission denied: requires ${allowedPermissions.join(" or ")}`));
    }
    return ok(true);
  };
  return {
    async getPublicBanner() {
      try { return ok(await read()); } catch (error) { return fail(fromThrowable(error)); }
    },
    async getAdminBanner(actor) {
      const access = requireAdmin(actor, ["settings.view", "settings.update"]);
      if (!access.ok) return fail(access.error!);
      try { return ok(await read()); } catch (error) { return fail(fromThrowable(error)); }
    },
    async uploadBanner(input, actor) {
      const access = requireAdmin(actor, ["settings.update"]);
      if (!access.ok) return fail(access.error!);
      if (!input.bytes.byteLength) return fail(validationError("Choose an image to upload.", "file"));
      if (input.bytes.byteLength > MAX_BYTES) return fail(createBackendError({ code: ERROR_CODES.UPLOAD_TOO_LARGE, type: "storage", message: "Image must be 5 MB or smaller.", field: "file" }));
      if (!ALLOWED_TYPES.has(input.mimeType) || !signatureMatches(input.bytes, input.mimeType)) {
        return fail(createBackendError({ code: ERROR_CODES.UNSUPPORTED_FILE_TYPE, type: "storage", message: "Use a valid JPG, PNG, or WebP image.", field: "file" }));
      }
      let uploaded: PublicBannerDTO | null = null;
      let activated = false;
      try {
        const before = await read();
        uploaded = await deps.repository.upload(input);
        const active = await deps.repository.activate(uploaded, actor);
        activated = true;
        await deps.auditRepository.record({ actor, action: "settings.public_banner_updated", entityType: "storage", entityId: active.path, summary: "Public dashboard banner updated", before, after: active });
        if (before.source === "storage" && before.path !== active.path) {
          await deps.repository.remove(before).catch(() => undefined);
        }
        return ok(active);
      } catch (error) {
        if (uploaded && !activated) await deps.repository.remove(uploaded).catch(() => undefined);
        return fail(fromThrowable(error));
      }
    },
  };
}

