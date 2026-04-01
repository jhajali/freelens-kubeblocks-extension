import { Renderer } from "@freelensapp/extensions";
import type { Cluster } from "../k8s/kubeblocks/cluster-v1";
import { getOpsTypeIcon } from "../utils";

const {
  Component: { MenuItem, Icon, ConfirmDialog },
} = Renderer;

type KubeObject = Renderer.K8sApi.LensExtensionKubeObject<Renderer.K8sApi.KubeObjectMetadata, unknown, unknown>;
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
