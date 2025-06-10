type StatsItemProps = {
  value: number;
  description: string;
  large?: boolean;
  secondary?: boolean;
};

export const StatsItem = ({ value, description, large, secondary }: StatsItemProps) => {
  return (
    <div
      className={`px-4 py-4 text-center ${
        secondary ? `w-32 ${large ? "bg-secondary" : "bg-pale-rose"}` : "bg-white w-52"
      }`}
    >
      <div className={`text-3xl font-extrabold ${large ? "text-primary" : "text-medium-purple"}`}>
        {value.toLocaleString()}
      </div>
      <div className="font-semibold">{description}</div>
    </div>
  );
};
