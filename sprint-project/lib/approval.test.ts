import { describe, expect, it } from "vitest";
import { planApproval } from "./approval";

describe("planApproval", () => {
  it("approves the target version and leaves an untouched draft alone", () => {
    const versions = [
      { id: "a", status: "draft" as const },
      { id: "b", status: "draft" as const },
    ];

    const plan = planApproval(versions, "a");

    expect(plan.find((v) => v.id === "a")?.status).toBe("approved");
    expect(plan.find((v) => v.id === "b")?.status).toBe("draft");
  });

  it("demotes the previously approved version to draft", () => {
    const versions = [
      { id: "a", status: "approved" as const },
      { id: "b", status: "draft" as const },
    ];

    const plan = planApproval(versions, "b");

    expect(plan.find((v) => v.id === "a")?.status).toBe("draft");
    expect(plan.find((v) => v.id === "b")?.status).toBe("approved");
  });

  it("leaves a manually_edited, non-approved version's status alone", () => {
    const versions = [
      { id: "a", status: "manually_edited" as const },
      { id: "b", status: "draft" as const },
    ];

    const plan = planApproval(versions, "b");

    expect(plan.find((v) => v.id === "a")?.status).toBe("manually_edited");
  });
});
