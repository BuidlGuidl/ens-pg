export type GrantProgressBarProps = {
  className?: string;
  amount: number;
  withdrawn?: number;
  available?: number;
};

export const LargeGrantProgressBar = ({
  amount,
  withdrawn = 0,
  available = 0,
  className = "",
}: GrantProgressBarProps) => {
  const availablePercentage = (available / amount) * 100;
  const withdrawnPercentage = (withdrawn / amount) * 100;

  if (!amount) {
    return null;
  }

  return (
    <div className={className}>
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
        <span>{withdrawn} USDC received</span>
        <span>{amount} USDC</span>
      </div>
    </div>
  );
};
