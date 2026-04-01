import { Renderer } from "@freelensapp/extensions";
import type { DumpOptions } from "js-yaml";

const {
  Navigation: { getDetailsUrl },
} = Renderer;

export function getMaybeDetailsUrl(url?: string): string {
  if (url) {
    return getDetailsUrl(url);
  } else {
    return "";
  }
}

export function getHeight(data?: string): number {
  const lineHeight = 18;
  if (!data) return lineHeight;

  const lines = data.split("\n").length;
  if (lines < 5) return 5 * lineHeight;
  if (lines > 20) return 20 * lineHeight;
  return lines * lineHeight;
}

export const defaultYamlDumpOptions: DumpOptions = {
  noArrayIndent: true,
  noCompatMode: true,
  noRefs: true,
  quotingType: '"',
  sortKeys: true,
};

export function createEnumFromKeys<T extends Record<string, any>>(obj: T): Record<keyof T, keyof T> {
  return Object.keys(obj).reduce(
    (acc, key) => {
      acc[key as keyof T] = key as keyof T;
      return acc;
    },
    {} as Record<keyof T, keyof T>,
  );
}

export function getPhaseClass(phase?: string): string {
  switch (phase) {
    case "Running":
    case "Healthy":
    case "Completed":
    case "Succeed":
    case "Available":
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

export function getOpsTypeIcon(type?: string): string {
  switch (type) {
    case "Restart":
      return "restart_alt";
    case "Stop":
      return "stop";
    case "Start":
      return "play_arrow";
    case "VerticalScaling":
      return "straighten";
    case "HorizontalScaling":
      return "view_column";
    case "VolumeExpansion":
      return "storage";
    case "Upgrade":
      return "upgrade";
    case "Backup":
      return "backup";
    case "Restore":
      return "restore";
    case "Expose":
      return "public";
    case "Switchover":
      return "swap_horiz";
    case "Reconfiguring":
      return "settings";
    default:
      return "build";
  }
}
