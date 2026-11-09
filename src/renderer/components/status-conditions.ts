import type { Renderer } from "@freelensapp/extensions";

type Condition = Renderer.K8sApi.Condition;

export function getPhaseText(phase?: string): string {
  return phase || "Unknown";
}

export function getPhaseClass(phase?: string): string {
  switch (phase) {
    case "Running":
    case "Healthy":
    case "Completed":
    case "Succeed":
    case "Available":
    case "Enabled":
      return "success";
    case "Failed":
    case "Abnormal":
    case "ConditionsError":
      return "error";
    case "Creating":
    case "Updating":
    case "Deleting":
    case "Progressing":
    case "Pending":
      return "warning";
    case "Stopped":
    case "Suspended":
    case "Disabled":
      return "info";
    default:
      return "";
  }
}

export function getConditionText(conditions?: Condition[]): string {
  if (!conditions || conditions.length === 0) return "OK";
  const errors = conditions.filter((c) => c.type === "Error" || c.status === "False");
  if (errors.length > 0) return `${errors.length} Error(s)`;
  return "OK";
}

export function getConditionClass(conditions?: Condition[]): string {
  if (!conditions || conditions.length === 0) return "success";
  const errors = conditions.filter((c) => c.type === "Error" || c.status === "False");
  if (errors.length > 0) return "error";
  return "success";
}

export function getStatusMessage(conditions?: Condition[]): string | undefined {
  if (!conditions || conditions.length === 0) return undefined;
  return conditions[0]?.message;
}
