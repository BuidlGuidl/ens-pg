import { TransactionReceipt } from "viem";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { displayTxResult } from "~~/app/debug/_components/contract";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth/useCopyToClipboard";

export const TxReceipt = (
  txResult: string | number | bigint | Record<string, any> | TransactionReceipt | undefined,
) => {
  const { copyToClipboard: copyTxResultToClipboard, isCopiedToClipboard: isTxResultCopiedToClipboard } =
    useCopyToClipboard();

  return (
    <div className="flex text-sm rounded-3xl peer-checked:rounded-b-none min-h-0 bg-secondary py-0">
      <div className="mt-1 pl-2">
        {isTxResultCopiedToClipboard ? (
          <CheckCircleIcon
            className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
            aria-hidden="true"
          />
        ) : (
          <DocumentDuplicateIcon
            className="ml-1.5 text-xl font-normal h-5 w-5 cursor-pointer"
            aria-hidden="true"
            onClick={() => copyTxResultToClipboard(displayTxResult(txResult) as string)}
          />
        )}
      </div>
      <div className="flex-wrap collapse collapse-arrow">
        <input type="checkbox" className="min-h-0 peer" />
        <div className="collapse-title text-sm min-h-0 py-1.5 pl-1">
          <strong>Transaction Receipt</strong>
        </div>
        <div className="collapse-content overflow-auto bg-secondary rounded-t-none rounded-3xl">
          <pre className="text-xs pt-4">{displayTxResult(txResult)}</pre>
        </div>
      </div>
    </div>
  );
};
