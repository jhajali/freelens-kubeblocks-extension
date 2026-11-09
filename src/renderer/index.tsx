import { Renderer } from "@freelensapp/extensions";
import { BackupDetails } from "./components/details/backup-details";
import { ClusterDefinitionDetails } from "./components/details/cluster-definition-details";
import { ClusterDetails } from "./components/details/cluster-details";
import { ComponentDefinitionDetails } from "./components/details/component-definition-details";
import { ComponentDetails } from "./components/details/component-details";
import { OpsRequestDetails } from "./components/details/opsrequest-details";
import { RestoreDetails } from "./components/details/restore-details";
import {
  withDetailsErrorBoundary,
  withMenuItemErrorBoundary,
  withPageErrorBoundary,
} from "./components/error-boundary";
import svgIcon from "./icons/kubeblocks.svg?raw";
import { BackupPolicy } from "./k8s/kubeblocks/backup-policy-v1alpha1";
import { BackupRepo } from "./k8s/kubeblocks/backup-repo-v1alpha1";
import { BackupSchedule } from "./k8s/kubeblocks/backup-schedule-v1alpha1";
import { Backup } from "./k8s/kubeblocks/backup-v1alpha1";
import { ClusterDefinition } from "./k8s/kubeblocks/cluster-definition-v1";
import { Cluster } from "./k8s/kubeblocks/cluster-v1";
import { ComponentDefinition } from "./k8s/kubeblocks/component-definition-v1";
import { Component } from "./k8s/kubeblocks/component-v1";
import { OpsRequest } from "./k8s/kubeblocks/opsrequest-v1alpha1";
import { Restore } from "./k8s/kubeblocks/restore-v1alpha1";
import { RestartClusterMenuItem, StartClusterMenuItem, StopClusterMenuItem } from "./menus/cluster-ops-menu-items";
import { BackupLocationsPage } from "./pages/backup-locations";
import { BackupPoliciesPage } from "./pages/backup-policies";
import { BackupSchedulesPage } from "./pages/backup-schedules";
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

// Every page, details panel and menu item renders inside an error boundary, so that an error it throws stays in its
// place: the host has none around the details drawer or a menu item.
export default class KubeBlocksExtension extends Renderer.LensExtension {
  clusterPages: Renderer.LensExtension["clusterPages"] = [
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
        Page: () => <OperationsPage extension={this} />,
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
    {
      id: "kubeblocks-backup-locations",
      components: {
        Page: () => <BackupLocationsPage />,
      },
    },
    {
      id: "kubeblocks-backup-policies",
      components: {
        Page: () => <BackupPoliciesPage />,
      },
    },
    {
      id: "kubeblocks-backup-schedules",
      components: {
        Page: () => <BackupSchedulesPage />,
      },
    },
  ].map((registration) => withPageErrorBoundary(this, registration));

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
    {
      id: "kubeblocks-backup-locations",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-backup-locations" },
      title: "Backup Locations",
      components: {},
    },
    {
      id: "kubeblocks-backup-policies",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-backup-policies" },
      title: "Backup Policies",
      components: {},
    },
    {
      id: "kubeblocks-backup-schedules",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-backup-schedules" },
      title: "Backup Schedules",
      components: {},
    },
  ];

  kubeObjectDetailItems: Renderer.LensExtension["kubeObjectDetailItems"] = [
    Renderer.K8sApi.detailsFor(Cluster, { priority: 10, Details: ClusterDetails }),
    Renderer.K8sApi.detailsFor(Component, { priority: 10, Details: ComponentDetails }),
    Renderer.K8sApi.detailsFor(OpsRequest, { priority: 10, Details: OpsRequestDetails }),
    Renderer.K8sApi.detailsFor(Backup, { priority: 10, Details: BackupDetails }),
    Renderer.K8sApi.detailsFor(Restore, { priority: 10, Details: RestoreDetails }),
    Renderer.K8sApi.detailsFor(ClusterDefinition, { priority: 10, Details: ClusterDefinitionDetails }),
    Renderer.K8sApi.detailsFor(ComponentDefinition, { priority: 10, Details: ComponentDefinitionDetails }),
  ].map((registration) => withDetailsErrorBoundary(this, registration));

  kubeObjectMenuItems: Renderer.LensExtension["kubeObjectMenuItems"] = [
    Renderer.K8sApi.menuItemFor(Cluster, { MenuItem: RestartClusterMenuItem }),
    Renderer.K8sApi.menuItemFor(Cluster, { MenuItem: StopClusterMenuItem }),
    Renderer.K8sApi.menuItemFor(Cluster, { MenuItem: StartClusterMenuItem }),
  ].map((registration) => withMenuItemErrorBoundary(this, registration));

  // The kinds with a sidebar entry of their own, so that the Custom Resources tree does not list them a second time.
  customResources = [
    Cluster,
    Component,
    OpsRequest,
    Backup,
    Restore,
    ClusterDefinition,
    ComponentDefinition,
    BackupRepo,
    BackupPolicy,
    BackupSchedule,
  ];
}
