import { Renderer } from "@freelensapp/extensions";
import styles from "./pie-chart.module.scss";
import stylesInline from "./pie-chart.module.scss?inline";

import type React from "react";
import type { Cluster } from "../k8s/kubeblocks/cluster-v1";

const getPhaseStats = (objects: Cluster[]) => {
  const running = objects.filter((o) => o.status?.phase === "Running").length;
  const stopped = objects.filter((o) => o.status?.phase === "Stopped").length;
  const failed = objects.filter((o) => o.status?.phase === "Failed" || o.status?.phase === "Abnormal").length;
  const creating = objects.filter((o) => o.status?.phase === "Creating" || o.status?.phase === "Updating").length;
  const other = objects.length - running - stopped - failed - creating;
  return { running, stopped, failed, creating, other };
};

export interface ClusterPhasePieChartProps {
  objects: Cluster[];
  title: string;
}

export function ClusterPhasePieChart(props: ClusterPhasePieChartProps): React.ReactElement {
  const { objects, title } = props;
  const { running, stopped, failed, creating, other } = getPhaseStats(objects);

  const chartData = {
    datasets: [
      {
        data: [running, creating, stopped, failed, other],
        backgroundColor: ["#43a047", "#FF6600", "#3d90ce", "#ce3933", "#3a3a3c"],
        tooltipLabels: [
          (percent: string) => `Running: ${percent}`,
          (percent: string) => `Creating/Updating: ${percent}`,
          (percent: string) => `Stopped: ${percent}`,
          (percent: string) => `Failed: ${percent}`,
          (percent: string) => `Other: ${percent}`,
        ],
      },
    ],
    labels: [
      `Running: ${running}`,
      `Creating/Updating: ${creating}`,
      `Stopped: ${stopped}`,
      `Failed: ${failed}`,
      `Other: ${other}`,
    ],
  } as unknown as Renderer.Component.PieChartData;

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.title}>
        <span>{title} ({objects.length})</span>
      </div>
      <Renderer.Component.PieChart data={chartData} />
    </>
  );
}
