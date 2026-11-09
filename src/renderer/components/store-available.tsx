import { Common } from "@freelensapp/extensions";

import type React from "react";

/**
 * Renders nothing while a kind's store is not registered: the CRD is not installed, or the cluster frame has not
 * loaded the CRDs yet. The caller is an `observer`, so it renders again once the host registers the store. Any other
 * error is rethrown to the page's `ErrorBoundary`.
 */
export function whenStoreAvailable(render: () => React.ReactElement): React.ReactElement | null {
  try {
    return render();
  } catch (error) {
    const errorMessage = String(error);

    if (errorMessage.includes("not registered") || errorMessage.includes("getStore")) {
      Common.logger.debug(`[@freelensapp/kubeblocks-extension]: API not available - ${error}`);
      return null;
    }

    throw error;
  }
}
