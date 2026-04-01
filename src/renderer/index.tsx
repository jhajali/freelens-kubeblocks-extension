import { Renderer } from "@freelensapp/extensions";
import { BackupDetails } from "./components/details/backup-details";
import { ClusterDetails } from "./components/details/cluster-details";
import { ClusterDefinitionDetails } from "./components/details/cluster-definition-details";
import { ComponentDetails } from "./components/details/component-details";
import { ComponentDefinitionDetails } from "./components/details/component-definition-details";
import { OpsRequestDetails } from "./components/details/opsrequest-details";
import { RestoreDetails } from "./components/details/restore-details";
import svgIcon from "./icons/kubeblocks.svg?raw";
import { Backup } from "./k8s/kubeblocks/backup-v1alpha1";
import { ClusterDefinition } from "./k8s/kubeblocks/cluster-definition-v1";
import { Cluster } from "./k8s/kubeblocks/cluster-v1";
import { ComponentDefinition } from "./k8s/kubeblocks/component-definition-v1";
import { Component } from "./k8s/kubeblocks/component-v1";
import { OpsRequest } from "./k8s/kubeblocks/opsrequest-v1alpha1";
import { Restore } from "./k8s/kubeblocks/restore-v1alpha1";
import {
  type ClusterOpsMenuItemProps,
  RestartClusterMenuItem,
  StartClusterMenuItem,
  StopClusterMenuItem,
} from "./menus/cluster-ops-menu-items";
import { BackupsPage } from "./pages/backups";
import { ClustersPage } from "./pages/clusters";
import { ComponentsPage } from "./pages/components";
import { CreateOperationPage } from "./pages/create-operation";
import { DefinitionsPage } from "./pages/definitions";
import { OperationsPage } from "./pages/operations";
import { KubeBlocksOverviewPage } from "./pages/overview";
import { RestoresPage } from "./pages/restores";

const {
  Component: { Icon },
} = Renderer;

export function KubeBlocksIcon(props: Renderer.Component.IconProps) {
  return <Icon {...props} svg={svgIcon} />;
}

export default class KubeBlocksExtension extends Renderer.LensExtension {
  clusterPages = [
    {
      id: "kubeblocks-dashboard",
      components: {
        Page: () => <KubeBlocksOverviewPage />,
      },
    },
    {
      id: "kubeblocks-clusters",
      components: {
        Page: () => <ClustersPage />,
      },
    },
    {
      id: "kubeblocks-components",
      components: {
        Page: () => <ComponentsPage />,
      },
    },
    {
      id: "kubeblocks-operations",
      components: {
        Page: () => <OperationsPage />,
      },
    },
    {
      id: "kubeblocks-create-operation",
      components: {
        Page: () => <CreateOperationPage />,
      },
    },
    {
      id: "kubeblocks-backups",
      components: {
        Page: () => <BackupsPage />,
      },
    },
    {
      id: "kubeblocks-restores",
      components: {
        Page: () => <RestoresPage />,
      },
    },
    {
      id: "kubeblocks-definitions",
      components: {
        Page: () => <DefinitionsPage />,
      },
    },
  ];

  clusterPageMenus = [
    {
      id: "kubeblocks",
      title: "KubeBlocks",
      target: { pageId: "kubeblocks-dashboard" },
      components: {
        Icon: KubeBlocksIcon,
      },
    },
    {
      id: "kubeblocks-dashboard",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-dashboard" },
      title: "Overview",
      components: {},
    },
    {
      id: "kubeblocks-clusters",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-clusters" },
      title: Cluster.crd.title,
      components: {},
    },
    {
      id: "kubeblocks-components",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-components" },
      title: Component.crd.title,
      components: {},
    },
    {
      id: "kubeblocks-operations",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-operations" },
      title: OpsRequest.crd.title,
      components: {},
    },
    {
      id: "kubeblocks-create-operation",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-create-operation" },
      title: "Create Operation",
      components: {},
    },
    {
      id: "kubeblocks-backups",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-backups" },
      title: Backup.crd.title,
      components: {},
    },
    {
      id: "kubeblocks-restores",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-restores" },
      title: Restore.crd.title,
      components: {},
    },
    {
      id: "kubeblocks-definitions",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-definitions" },
      title: "Definitions",
      components: {},
    },
  ];

  kubeObjectDetailItems = [
    {
      kind: Cluster.kind,
      apiVersions: Cluster.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Cluster>) => <ClusterDetails {...props} />,
      },
    },
    {
      kind: Component.kind,
      apiVersions: Component.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Component>) => <ComponentDetails {...props} />,
      },
    },
    {
      kind: OpsRequest.kind,
      apiVersions: OpsRequest.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<OpsRequest>) => <OpsRequestDetails {...props} />,
      },
    },
    {
      kind: Backup.kind,
      apiVersions: Backup.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Backup>) => <BackupDetails {...props} />,
      },
    },
    {
      kind: Restore.kind,
      apiVersions: Restore.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Restore>) => <RestoreDetails {...props} />,
      },
    },
    {
      kind: ClusterDefinition.kind,
      apiVersions: ClusterDefinition.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<ClusterDefinition>) => (
          <ClusterDefinitionDetails {...props} />
        ),
      },
    },
    {
      kind: ComponentDefinition.kind,
      apiVersions: ComponentDefinition.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<ComponentDefinition>) => (
          <ComponentDefinitionDetails {...props} />
        ),
      },
    },
  ];

  kubeObjectMenuItems = [
    {
      kind: Cluster.kind,
      apiVersions: Cluster.crd.apiVersions,
      components: {
        MenuItem: (props: ClusterOpsMenuItemProps) => <RestartClusterMenuItem {...props} resource={Cluster} />,
      },
    },
    {
      kind: Cluster.kind,
      apiVersions: Cluster.crd.apiVersions,
      components: {
        MenuItem: (props: ClusterOpsMenuItemProps) => <StopClusterMenuItem {...props} resource={Cluster} />,
      },
    },
    {
      kind: Cluster.kind,
      apiVersions: Cluster.crd.apiVersions,
      components: {
        MenuItem: (props: ClusterOpsMenuItemProps) => <StartClusterMenuItem {...props} resource={Cluster} />,
      },
    },
  ];
}
