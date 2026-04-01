import ReactDOM from "react-dom";
import type { OpsRequestType } from "../../k8s/kubeblocks/types";
import { WizardDialog } from "./wizard-dialog";

export interface ShowWizardOptions {
  preselectedCluster?: string;
  preselectedNamespace?: string;
  preselectedType?: OpsRequestType;
}

export function showOpsWizard(options: ShowWizardOptions = {}) {
  const container = document.createElement("div");
  container.setAttribute("data-kubeblocks-wizard", "true");
  document.body.appendChild(container);

  const close = () => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  };

  ReactDOM.render(
    <WizardDialog
      isOpen={true}
      onClose={close}
      preselectedCluster={options.preselectedCluster}
      preselectedNamespace={options.preselectedNamespace}
      preselectedType={options.preselectedType}
    />,
    container,
  );
}
