import { LargeMilestoneStatus } from "~~/services/database/repositories/large-milestones";

const badgeBgColor: Record<LargeMilestoneStatus, string> = {
  proposed: "bg-warning",
  rejected: "bg-error",
  completed: "bg-warning",
  verified: "bg-warning",
  paid: "bg-success",
  approved: "bg-success",
};

const badgeTextColor: Record<LargeMilestoneStatus, string> = {
  proposed: "text-primary-orange",
  rejected: "text-primary-red",
  completed: "text-primary-orange",
  verified: "text-primary-orange",
  paid: "text-primary-green",
  approved: "text-primary-green",
};

type BadgeSize = "sm" | "md";

type BadgeProps = {
  status: LargeMilestoneStatus;
  size?: BadgeSize;
  className?: string;
};

export const statusText: Record<LargeMilestoneStatus, string> = {
  proposed: "Proposed",
  rejected: "Rejected",
  completed: "Completed (Pending Review)",
  verified: "Completed (Pending Review)",
  paid: "Completed (Paid)",
  approved: "Approved",
};

const badgeSizeClassNames: Record<BadgeSize, string> = {
  sm: "text-xs px-2 py-1.5",
  md: "text-sm px-4 py-1.5",
};

export const BadgeMilestone = ({ status, size = "md", className = "" }: BadgeProps) => {
  const sizeClasses = badgeSizeClassNames[size];

  return (
    <div
      className={`badge font-bold rounded-lg capitalize h-auto ${badgeBgColor[status]} ${badgeTextColor[status]} ${sizeClasses} ${className}`}
    >
      {statusText[status]}
    </div>
  );
};
