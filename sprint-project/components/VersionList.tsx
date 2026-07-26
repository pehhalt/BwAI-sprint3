import { ApprovalButton } from "@/components/ApprovalButton";
import { ModelBadge } from "@/components/ModelBadge";
import type { RewriteVersion } from "@/lib/types";

export function VersionList({
  projectId,
  sectionId,
  versions,
}: {
  projectId: string;
  sectionId: string;
  versions: RewriteVersion[];
}) {
  if (versions.length === 0) {
    return <p className="text-sm text-gray-500">No versions yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-medium">Version history</h2>
      <ul className="flex flex-col gap-2">
        {versions.map((version) => (
          <li
            key={version.id}
            className="flex items-center justify-between rounded border border-gray-200 p-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={
                  version.status === "approved"
                    ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                    : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                }
              >
                {version.status}
              </span>
              <ModelBadge model={version.model} />
              <span className="text-xs text-gray-500">
                {new Date(version.created_at).toLocaleString()}
              </span>
            </div>
            {version.status !== "approved" && (
              <ApprovalButton
                projectId={projectId}
                sectionId={sectionId}
                versionId={version.id}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
