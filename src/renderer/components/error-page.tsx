import { Common } from "@freelensapp/extensions";
import React from "react";
import styles from "./error-page.module.scss";
import stylesInline from "./error-page.module.scss?inline";

export interface ErrorPageProps {
  error?: unknown;
  children?: React.ReactNode;
}

export function ErrorPage({ error, children }: ErrorPageProps) {
  if (error) {
    Common.logger.error(`[@freelensapp/kubeblocks-extension]: ${error}`);
  }
  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.errorPage}>
        {error ? <p className={styles.errorMessage}>{String(error)}</p> : <></>}
        {children}
      </div>
    </>
  );
}

export function withErrorPage(wrapped: () => JSX.Element) {
  try {
    return wrapped();
  } catch (error) {
    const errorMessage = String(error);

    if (errorMessage.includes("not registered") || errorMessage.includes("getStore")) {
      Common.logger.debug(`[@freelensapp/kubeblocks-extension]: API not available - ${error}`);
      return null;
    }

    return <ErrorPage error={error} />;
  }
}
