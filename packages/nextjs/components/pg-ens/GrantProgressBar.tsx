export type GrantProgressBarProps = {
  className?: string;
  amount: number;
  withdrawn?: number;
  available?: number;
  isLargeGrant?: boolean;
};

export const GrantProgressBar = ({
  amount,
  withdrawn = 0,
  available = 0,
  className = "",
  isLargeGrant = false,
}: GrantProgressBarProps) => {
  const availablePercentage = (available / amount) * 100;
  const withdrawnPercentage = (withdrawn / amount) * 100;

  if (!amount) {
    return null;
  }

  return (
    <div className={className}>
      {!isLargeGrant && (
        <div className="text-end">{available ? `${available.toLocaleString()} ETH available to withdraw` : ""}</div>
      )}
      <div className="bg-gray-300 h-4 rounded relative mt-2">
        <div
          className="bg-primary rounded absolute z-[2] inset-y-0 left-0"
          style={{ width: `${withdrawnPercentage}%` }}
        />
        <div
          className="bg-medium-purple rounded absolute z-[1] inset-y-0 left-0"
          style={{ width: `${Math.min(withdrawnPercentage + availablePercentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between font-semibold mt-2">
        <span>
          {withdrawn.toLocaleString()} {isLargeGrant ? "USDC received" : "ETH withdrawn"}
        </span>
        <span>
          {amount.toLocaleString()} {isLargeGrant ? "USDC" : "ETH"}
        </span>
      </div>
    </div>
  );
};
