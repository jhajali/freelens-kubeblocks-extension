import { Renderer } from "@freelensapp/extensions";
import styles from "./confirmation-dialog.module.scss";
import stylesInline from "./confirmation-dialog.module.scss?inline";

const {
  Component: { Button },
} = Renderer;

export interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({ message, onConfirm, onCancel }: ConfirmationDialogProps) {
  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.dialog}>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button plain onClick={onCancel}>Cancel</Button>
          <Button primary onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </>
  );
}
