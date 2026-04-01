"use client";

import { Loader2 } from "lucide-react";

export type Mode = "report" | "prices";

export type DeleteModalState =
  | null
  | {
      open: true;
      mode: Mode;
      objectNames: string[];
      sourceFiles?: string[];
      displayName: string;
      alsoDeletesGenerated?: boolean;
    };

export function DeleteModal({
  state,
  busy = false,
  onClose,
  onConfirmDelete,
}: {
  state: DeleteModalState;
  busy?: boolean;
  onClose: () => void;
  onConfirmDelete: (payload: {
    objectNames: string[];
    sourceFiles?: string[];
    mode: "report" | "prices";
    displayName: string;
  }) => Promise<void>;
}) {
  if (!state?.open) return null;

  return (
    <div className="modalRoot" role="dialog" aria-modal="true">
      <div className="modalBackdrop" onClick={busy ? undefined : onClose} aria-hidden="true" />
      <div className="modalCenter">
        <div className="modalCard">
          <div className="modalHeader">
            <div className="modalTitle">DELETE FILE</div>
            <div className="modalSub">
              {busy ? "Deleting file and refreshing list..." : "This action can't be undone."}
            </div>
          </div>

          <div className="modalBody">
            You're about to delete: <b>{state.displayName}</b>
            {state.alsoDeletesGenerated ? (
              <div className="modalHint">
                This will also delete the generated output linked to this file.
              </div>
            ) : null}
          </div>

          <div className="modalFooter">
            <button className="secondaryBtn" type="button" onClick={onClose} disabled={busy}>
              CANCEL
            </button>

            <button
              className="dangerBtnSolid"
              type="button"
              disabled={busy}
              onClick={async () => {
                const m = state;
                await onConfirmDelete({
                  objectNames: m.objectNames,
                  sourceFiles: m.sourceFiles,
                  mode: m.mode,
                  displayName: m.displayName,
                });
                onClose();
              }}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  DELETING...
                </>
              ) : (
                "DELETE"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
