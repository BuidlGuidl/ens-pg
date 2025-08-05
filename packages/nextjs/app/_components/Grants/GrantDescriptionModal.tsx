import { forwardRef } from "react";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

type GrantDescriptionModalProps = {
  description: string;
  id: number;
};

export const GrantDescriptionModal = forwardRef<HTMLDialogElement, GrantDescriptionModalProps>(
  ({ description, id }, ref) => {
    return (
      <dialog id={`milestones_modal_${id}`} className="modal" ref={ref}>
        <div className="modal-box flex flex-col space-y-3">
          <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4">
            <div className="flex items-center">
              <p className="font-bold text-xl m-0 text-center w-full">Grant Description</p>
            </div>
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto absolute top-3.5 right-6">✕</button>
          </form>
          <div className="max-h-96 overflow-y-auto text-gray-700 whitespace-pre-line">
            {multilineStringToTsx(description)}
          </div>
        </div>
      </dialog>
    );
  },
);

GrantDescriptionModal.displayName = "GrantDescriptionModal";
