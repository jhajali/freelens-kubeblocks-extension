import { Renderer } from "@freelensapp/extensions";
import { showOpsWizard } from "../components/ops-wizard/show-wizard";
import type { Cluster } from "../k8s/kubeblocks/cluster-v1";
import type { OpsRequestType } from "../k8s/kubeblocks/types";

const {
  Component: { MenuItem, Icon, ConfirmDialog },
} = Renderer;

type KubeObjectCtor = typeof Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  unknown,
  unknown
>;

export interface ClusterOpsMenuItemProps extends Renderer.Component.KubeObjectMenuProps<Cluster> {
  resource: KubeObjectCtor;
}

function createOpsRequest(clusterName: string, namespace: string, type: string) {
  const apiBase = "/apis/apps.kubeblocks.io/v1alpha1/namespaces/" + namespace + "/opsrequests";
  const name = `${clusterName}-${type.toLowerCase()}-${Date.now()}`;

  const body: any = {
    apiVersion: "apps.kubeblocks.io/v1alpha1",
    kind: "OpsRequest",
    metadata: { name, namespace },
    spec: { clusterName, type },
  };

  return fetch(`/api-kube${apiBase}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Simple ops — create OpsRequest directly with confirmation dialog

export function RestartClusterMenuItem(props: ClusterOpsMenuItemProps) {
  const { object, toolbar } = props;
  if (!object) return <></>;

  return (
    <MenuItem onClick={() => {
      ConfirmDialog.open({
        ok: async () => { await createOpsRequest(object.getName(), object.getNs() ?? "", "Restart"); },
        labelOk: "Restart",
        message: <p>Restart cluster <b>{object.getName()}</b>?</p>,
      });
    }}>
      <Icon material="restart_alt" interactive={toolbar} title="Restart" />
      <span className="title">Restart</span>
    </MenuItem>
  );
}

export function StopClusterMenuItem(props: ClusterOpsMenuItemProps) {
  const { object, toolbar } = props;
  if (!object) return <></>;

  return (
    <MenuItem onClick={() => {
      ConfirmDialog.open({
        ok: async () => { await createOpsRequest(object.getName(), object.getNs() ?? "", "Stop"); },
        labelOk: "Stop",
        message: <p>Stop cluster <b>{object.getName()}</b>?</p>,
      });
    }}>
      <Icon material="stop" interactive={toolbar} title="Stop" />
      <span className="title">Stop</span>
    </MenuItem>
  );
}

export function StartClusterMenuItem(props: ClusterOpsMenuItemProps) {
  const { object, toolbar } = props;
  if (!object) return <></>;

  return (
    <MenuItem onClick={() => {
      ConfirmDialog.open({
        ok: async () => { await createOpsRequest(object.getName(), object.getNs() ?? "", "Start"); },
        labelOk: "Start",
        message: <p>Start cluster <b>{object.getName()}</b>?</p>,
      });
    }}>
      <Icon material="play_arrow" interactive={toolbar} title="Start" />
      <span className="title">Start</span>
    </MenuItem>
  );
}

// Wizard ops — open wizard dialog imperatively (mounted on document.body, survives menu close)

function makeWizardMenuItem(icon: string, label: string, opsType?: OpsRequestType) {
  return function WizardMenuItem(props: ClusterOpsMenuItemProps) {
    const { object, toolbar } = props;
    if (!object) return <></>;

    return (
      <MenuItem onClick={() => {
        showOpsWizard({
          preselectedCluster: object.getName(),
          preselectedNamespace: object.getNs() ?? "",
          preselectedType: opsType,
        });
      }}>
        <Icon material={icon} interactive={toolbar} title={label} />
        <span className="title">{label}</span>
      </MenuItem>
    );
  };
}

export const VerticalScaleMenuItem = makeWizardMenuItem("straighten", "Vertical Scale", "VerticalScaling");
export const HorizontalScaleMenuItem = makeWizardMenuItem("width_normal", "Horizontal Scale", "HorizontalScaling");
export const VolumeExpandMenuItem = makeWizardMenuItem("storage", "Volume Expand", "VolumeExpansion");
export const UpgradeMenuItem = makeWizardMenuItem("upgrade", "Upgrade", "Upgrade");
export const BackupMenuItem = makeWizardMenuItem("backup", "Backup", "Backup");
export const ExposeMenuItem = makeWizardMenuItem("public", "Expose", "Expose");
export const SwitchoverMenuItem = makeWizardMenuItem("swap_horiz", "Switchover", "Switchover");
export const CustomOperationMenuItem = makeWizardMenuItem("build", "Custom Operation");
