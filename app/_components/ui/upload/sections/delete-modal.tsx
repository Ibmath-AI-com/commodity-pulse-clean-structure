"use client";

export type Mode = "report" | "prices";

export type DeleteModalState =
  | null
  | {
      open: true;
      mode: Mode;
      objectNames: string[];
      displayName: string;
      alsoDeletesGenerated?: boolean;
    };

export function DeleteModal({
  state,
  onClose,
  onConfirmDelete,
}: {
  state: DeleteModalState;
  onClose: () => void;
  onConfirmDelete: (payload: {
    objectNames: string[];
    mode: "report" | "prices";
    displayName: string;
  }) => Promise<void>;
}) {
  if (!state?.open) return null;

  return (
    <div className="modalRoot" role="dialog" aria-modal="true">
      <div className="modalBackdrop" onClick={onClose} aria-hidden="true" />
      <div className="modalCenter">
        <div className="modalCard">
          <div className="modalHeader">
            <div className="modalTitle">DELETE FILE</div>
            <div className="modalSub">This action can’t be undone.</div>
          </div>

          <div className="modalBody">
            You’re about to delete: <b>{state.displayName}</b>
            {state.alsoDeletesGenerated ? (
              <div className="modalHint">
                This will also delete the generated output linked to this file.
              </div>
            ) : null}
          </div>

          <div className="modalFooter">
            <button className="secondaryBtn" type="button" onClick={onClose}>
              CANCEL
            </button>

            <button
              className="dangerBtnSolid"
              type="button"
              onClick={async () => {
                const m = state;
                onClose();
                await onConfirmDelete({
                  objectNames: m.objectNames,
                  mode: m.mode,
                  displayName: m.displayName,
                });
              }}
            >
              DELETE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}