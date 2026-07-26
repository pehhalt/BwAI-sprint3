import type { RewriteVersionStatus } from "@/lib/types";

export type VersionStatus = {
  id: string;
  status: RewriteVersionStatus;
};

export function planApproval(
  versions: VersionStatus[],
  approveId: string
): VersionStatus[] {
  return versions.map((version) => {
    if (version.id === approveId) {
      return { ...version, status: "approved" };
    }
    if (version.status === "approved") {
      return { ...version, status: "draft" };
    }
    return version;
  });
}
