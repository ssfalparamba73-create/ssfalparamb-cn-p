import { describe, expect, it, vi } from "vitest";
import type { ActorContext } from "@/lib/backend/contracts/common.contract";
import type { AdminDashboardDTO } from "@/lib/backend/dto/dashboard.dto";
import { ok } from "@/lib/backend/errors/resultHelpers";
import { createDashboardService } from "@/lib/backend/services/dashboardService";

const adminActor: ActorContext = {
  actorType: "admin",
  adminId: "admin-1",
  requestId: "request-1",
};

function createService() {
  const dashboardRepository = {
    getAdminDashboard: vi.fn(async () => ({}) as AdminDashboardDTO),
    getMemberDashboard: vi.fn(async () => null),
  };
  const service = createDashboardService({
    dashboardRepository,
    requireAdminPermission: async () => ok(true),
  });
  return { dashboardRepository, service };
}

describe("admin dashboard month filter", () => {
  it.each(["", "2026-00", "2026-13", "2026-1", "0000-01"])(
    "rejects invalid month key %s",
    async (monthKey) => {
      const { dashboardRepository, service } = createService();

      const result = await service.getAdminDashboard(adminActor, monthKey);

      expect(result.ok).toBe(false);
      expect(result.error?.field).toBe("month");
      expect(dashboardRepository.getAdminDashboard).not.toHaveBeenCalled();
    }
  );

  it("passes a valid month key to the repository after the permission check", async () => {
    const { dashboardRepository, service } = createService();

    const result = await service.getAdminDashboard(adminActor, "2026-11");

    expect(result.ok).toBe(true);
    expect(dashboardRepository.getAdminDashboard).toHaveBeenCalledWith("2026-11");
  });
});
