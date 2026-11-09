import { describe, expect, it } from "vitest";
import { Cluster } from "../k8s/kubeblocks/cluster-v1";
import { whenStoreAvailable } from "./store-available";

describe("whenStoreAvailable", () => {
  it("renders nothing while the store is not registered", () => {
    expect(whenStoreAvailable(() => (Cluster.getStore(), (<p />)))).toBeNull();
  });

  it("rethrows any other error to the error boundary", () => {
    expect(() =>
      whenStoreAvailable(() => {
        throw new Error("boom");
      }),
    ).toThrow("boom");
  });
});
