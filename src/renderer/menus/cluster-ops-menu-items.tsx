import { Renderer } from "@freelensapp/extensions";
import { useState } from "react";
import { WizardDialog } from "../components/ops-wizard/wizard-dialog";
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

export function RestartClusterMenuItem(props: ClusterOpsMenuItemProps) {
  const { object, toolbar } = props;
  if (!object) return <></>;

  const doRestart = () => {
    ConfirmDialog.open({
      ok: async () => {
        await createOpsRequest(object.getName(), object.getNs() ?? "", "Restart");
      },
      labelOk: "Restart",
      message: (
        <p>Restart cluster <b>{object.getName()}</b>?</p>
      ),
    });
  };

  return (
    <MenuItem onClick={doRestart}>
      <Icon material="restart_alt" interactive={toolbar} title="Restart" />
      <span className="title">Restart</span>
    </MenuItem>
  );
}

export function StopClusterMenuItem(props: ClusterOpsMenuItemProps) {
  const { object, toolbar } = props;
  if (!object) return <></>;

  const doStop = () => {
    ConfirmDialog.open({
      ok: async () => {
        await createOpsRequest(object.getName(), object.getNs() ?? "", "Stop");
      },
      labelOk: "Stop",
      message: (
        <p>Stop cluster <b>{object.getName()}</b>?</p>
      ),
    });
  };

  return (
    <MenuItem onClick={doStop}>
      <Icon material="stop" interactive={toolbar} title="Stop" />
      <span className="title">Stop</span>
    </MenuItem>
  );
}

export function StartClusterMenuItem(props: ClusterOpsMenuItemProps) {
  const { object, toolbar } = props;
  if (!object) return <></>;

  const doStart = () => {
    ConfirmDialog.open({
      ok: async () => {
        await createOpsRequest(object.getName(), object.getNs() ?? "", "Start");
      },
      labelOk: "Start",
      message: (
        <p>Start cluster <b>{object.getName()}</b>?</p>
      ),
    });
  };

  return (
    <MenuItem onClick={doStart}>
      <Icon material="play_arrow" interactive={toolbar} title="Start" />
      <span className="title">Start</span>
    </MenuItem>
  );
}

// Wizard-launching menu items: each renders its own WizardDialog inline
// so it works regardless of which page the user is on

function WizardMenuItem({
  object,
  toolbar,
  icon,
  label,
  opsType,
}: {
  object: Cluster | undefined;
  toolbar: boolean | undefined;
  icon: string;
  label: string;
  opsType?: OpsRequestType;
}) {
  const [wizardOpen, setWizardOpen] = useState(false);
  if (!object) return <></>;

  return (
    <>
      <MenuItem onClick={() => setWizardOpen(true)}>
        <Icon material={icon} interactive={toolbar} title={label} />
        <span className="title">{label}</span>
      </MenuItem>
      <WizardDialog
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        preselectedCluster={object.getName()}
        preselectedNamespace={object.getNs() ?? ""}
        preselectedType={opsType}
      />
    </>
  );
}

export function VerticalScaleMenuItem(props: ClusterOpsMenuItemProps) {
  return <WizardMenuItem object={props.object} toolbar={props.toolbar} icon="straighten" label="Vertical Scale" opsType="VerticalScaling" />;
}

export function HorizontalScaleMenuItem(props: ClusterOpsMenuItemProps) {
  return <WizardMenuItem object={props.object} toolbar={props.toolbar} icon="width_normal" label="Horizontal Scale" opsType="HorizontalScaling" />;
}

export function VolumeExpandMenuItem(props: ClusterOpsMenuItemProps) {
  return <WizardMenuItem object={props.object} toolbar={props.toolbar} icon="storage" label="Volume Expand" opsType="VolumeExpansion" />;
}

export function UpgradeMenuItem(props: ClusterOpsMenuItemProps) {
  return <WizardMenuItem object={props.object} toolbar={props.toolbar} icon="upgrade" label="Upgrade" opsType="Upgrade" />;
}

export function BackupMenuItem(props: ClusterOpsMenuItemProps) {
  return <WizardMenuItem object={props.object} toolbar={props.toolbar} icon="backup" label="Backup" opsType="Backup" />;
}

export function ExposeMenuItem(props: ClusterOpsMenuItemProps) {
  return <WizardMenuItem object={props.object} toolbar={props.toolbar} icon="public" label="Expose" opsType="Expose" />;
}

export function SwitchoverMenuItem(props: ClusterOpsMenuItemProps) {
  return <WizardMenuItem object={props.object} toolbar={props.toolbar} icon="swap_horiz" label="Switchover" opsType="Switchover" />;
}

export function CustomOperationMenuItem(props: ClusterOpsMenuItemProps) {
  return <WizardMenuItem object={props.object} toolbar={props.toolbar} icon="build" label="Custom Operation" />;
}
