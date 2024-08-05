export type GrantProgressBarProps = {
  className?: string;
  amount: number;
  withdrawn?: number;
  available?: number;
};

export const GrantProgressBar = ({ amount, withdrawn = 0, available = 0, className = "" }: GrantProgressBarProps) => {
  const availablePercentage = ((available + withdrawn) / amount) * 100;
  const withdrawnPercentage = (withdrawn / amount) * 100;

  return (
    <div className={className}>
      {/* "\u00A0" is to prevent component jump on updating */}
      <div className="text-end">{available ? `${available} ETH available to withdraw` : "\u00A0"}</div>
      <div className="bg-gray-300 h-4 rounded relative mt-2">
        <div
          className="bg-primary rounded absolute z-[2] inset-y-0 left-0"
          style={{ width: `${withdrawnPercentage}%` }}
        />
        <div
          className="bg-medium-purple rounded absolute z-[1] inset-y-0 left-0"
          style={{ width: `${availablePercentage}%` }}
        />
      </div>
      <div className="flex justify-between font-semibold mt-2">
        <span>{withdrawn} ETH withdrawed</span>
        <span>{amount} ETH</span>
      </div>
    </div>
  );
};