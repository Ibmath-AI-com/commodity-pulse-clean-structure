"use client";

export type Mode = "report" | "prices";

export type ArchiveModalState =
  | null
  | {
      open: true;
      mode: Mode;
      objectNames: string[];
      displayName: string;
    };

export function ArchiveModal({
  state,
  onClose,
  onConfirmArchive,
}: {
  state: ArchiveModalState;
  onClose: () => void;
  onConfirmArchive: (payload: {
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
            <div className="modalTitle">ARCHIVE FILE</div>
            <div className="modalSub">This will hide the file from active use.</div>
          </div>

          <div className="modalBody">
            You’re about to archive: <b>{state.displayName}</b>
          </div>

          <div className="modalFooter">
            <button className="secondaryBtn" type="button" onClick={onClose}>
              CANCEL
            </button>

            <button
              className="primaryBtn"
              type="button"
              onClick={async () => {
                const m = state;
                onClose();
                await onConfirmArchive({
                  objectNames: m.objectNames,
                  mode: m.mode,
                  displayName: m.displayName,
                });
              }}
            >
              ARCHIVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}