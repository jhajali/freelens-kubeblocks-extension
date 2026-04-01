# Freelens KubeBlocks Extension

A [Freelens](https://github.com/freelensapp/freelens) extension for managing [KubeBlocks](https://kubeblocks.io/) database clusters directly from the Freelens IDE.

## Features

### Cluster Management
- **Clusters** — List all KubeBlocks clusters with phase, definition, and component count
- **Components** — View individual components within clusters with replicas and resource details
- **Overview Dashboard** — Cluster status pie chart, active operations, recent backups/restores, and filtered KubeBlocks events

### Operations
- **Create Operation** — Guided 4-step form to create OpsRequests:
  - Select cluster from a visual grid
  - Choose operation type (Restart, Stop, Start, Scale, Upgrade, Backup, Restore, Expose, Switchover, Reconfigure)
  - Configure with smart dropdowns (components from cluster spec, versions filtered by compatibility, backup methods from policies)
  - Review and edit YAML before submitting
- **Operations List** — View all OpsRequests with type, phase, and progress
- **Context Menu Actions** — Right-click any cluster for quick Restart, Stop, or Start

### Data Protection
- **Backups** — List backup resources with status, size, and duration
- **Restores** — Track restore operations
- **Backup Locations** — Manage BackupRepo resources with a create form that dynamically renders fields from StorageProvider schemas (S3, MinIO, Azure Blob, GCS, NFS, PVC, etc.)
- **Backup Policies** — View policies and their available backup methods per cluster
- **Backup Schedules** — View schedules with enabled/total counts

### Definitions
- **Cluster Definitions** — Browse available cluster templates
- **Component Definitions** — Inspect component templates with service kind, version, and roles

### Detail Views
Click any resource to see a detail panel with:
- Key fields displayed as drawer items
- Status conditions table
- Full spec YAML in a read-only Monaco editor

## Supported CRDs

| CRD | API Group | Version |
|-----|-----------|---------|
| Cluster | `apps.kubeblocks.io` | `v1` |
| Component | `apps.kubeblocks.io` | `v1` |
| ClusterDefinition | `apps.kubeblocks.io` | `v1` |
| ComponentDefinition | `apps.kubeblocks.io` | `v1` |
| ComponentVersion | `apps.kubeblocks.io` | `v1` |
| OpsRequest | `operations.kubeblocks.io` | `v1alpha1` |
| Backup | `dataprotection.kubeblocks.io` | `v1alpha1` |
| Restore | `dataprotection.kubeblocks.io` | `v1alpha1` |
| BackupRepo | `dataprotection.kubeblocks.io` | `v1alpha1` |
| BackupPolicy | `dataprotection.kubeblocks.io` | `v1alpha1` |
| BackupSchedule | `dataprotection.kubeblocks.io` | `v1alpha1` |
| StorageProvider | `dataprotection.kubeblocks.io` | `v1alpha1` |

Pages gracefully degrade when CRDs are not installed in the cluster.

## Installation

### From GitHub Release

1. Download the latest `.tgz` from [Releases](https://github.com/jhajali/freelens-kubeblocks-extension/releases)
2. In Freelens, go to **Extensions** (bottom-left)
3. Click **Install** and select the downloaded `.tgz` file
4. Restart Freelens

### From Source

```bash
git clone https://github.com/jhajali/freelens-kubeblocks-extension.git
cd freelens-kubeblocks-extension
make install
make pack
```

Then install the generated `.tgz` in Freelens.

## Requirements

- Freelens >= 1.6.0
- Node.js >= 22.16.0
- KubeBlocks installed in the target cluster

## Development

```bash
make install        # Install dependencies
make build          # Build with type checking
make build-force    # Build without type checking
make type-check     # TypeScript validation only
make pack           # Build and create .tgz
make clean          # Remove build output
```

After building, deploy to Freelens for testing:

```bash
make pack
cp -r out ~/.freelens/extensions/freelensapp--kubeblocks-extension/out
```

Then restart Freelens.

## License

MIT
