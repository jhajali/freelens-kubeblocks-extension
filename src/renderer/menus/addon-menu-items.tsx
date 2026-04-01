import { Renderer } from "@freelensapp/extensions";
import type { Addon } from "../k8s/kubeblocks/addon-v1alpha1";

const {
  Component: { MenuItem, Icon, ConfirmDialog },
} = Renderer;

type KubeObject = Renderer.K8sApi.LensExtensionKubeObject<Renderer.K8sApi.KubeObjectMetadata, unknown, unknown>;
type KubeObjectCtor = typeof Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  unknown,
  unknown
>;

export interface AddonMenuItemProps extends Renderer.Component.KubeObjectMenuProps<Addon> {
  resource: KubeObjectCtor;
}

export function EnableAddonMenuItem(props: AddonMenuItemProps) {
  const { object, toolbar, resource } = props;
  if (!object) return <></>;

  const store = resource.getStore<KubeObject>();
  if (!store) return <></>;

  if (object.status?.phase === "Enabled" || object.status?.phase === "Enabling") return <></>;

  const doEnable = () => {
    ConfirmDialog.open({
      ok: async () => {
        await store.patch(
          object,
          {
            spec: { installSpec: { enabled: true } },
          } as any,
          "merge",
        );
      },
      labelOk: "Enable",
      message: (
        <p>Enable addon <b>{object.getName()}</b>?</p>
      ),
    });
  };

  return (
    <MenuItem onClick={doEnable}>
      <Icon material="power" interactive={toolbar} title="Enable" />
      <span className="title">Enable</span>
    </MenuItem>
  );
}

export function DisableAddonMenuItem(props: AddonMenuItemProps) {
  const { object, toolbar, resource } = props;
  if (!object) return <></>;

  const store = resource.getStore<KubeObject>();
  if (!store) return <></>;

  if (object.status?.phase === "Disabled" || object.status?.phase === "Disabling") return <></>;

  const doDisable = () => {
    ConfirmDialog.open({
      ok: async () => {
        await store.patch(
          object,
          {
            spec: { installSpec: { enabled: false } },
          } as any,
          "merge",
        );
      },
      labelOk: "Disable",
      message: (
        <p>Disable addon <b>{object.getName()}</b>?</p>
      ),
    });
  };

  return (
    <MenuItem onClick={doDisable}>
      <Icon material="power_off" interactive={toolbar} title="Disable" />
      <span className="title">Disable</span>
    </MenuItem>
  );
}
