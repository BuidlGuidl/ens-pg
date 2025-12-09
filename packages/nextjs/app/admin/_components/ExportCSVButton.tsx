"use client";

import { gql, useQuery } from "@apollo/client";
import { formatEther } from "viem";
import { getFormattedDateWithDay } from "~~/utils/getFormattedDate";

const WITHDRAWALS_QUERY = gql`
  query GetAllWithdrawals {
    withdrawals(orderBy: "timestamp", orderDirection: "asc") {
      items {
        id
        amount
        grantNumber
        stageNumber
        to
      }
    }
  }
`;

// Serialized grant types for client component
type SerializedGrant = {
  id: number;
  title: string;
  builderAddress: string;
  email: string;
  submitedAt?: string;
  type: "grant";
  grantNumber?: number;
  requestedFunds?: string;
  stages: Array<{
    id: number;
    stageNumber: number;
    status: string;
    grantAmount?: string;
    submitedAt?: string;
    approvedAt?: string;
    milestones?: Array<{
      id: number;
      milestoneNumber: number;
      requestedAmount?: string;
      grantedAmount?: string;
      completedAt?: string;
    }>;
  }>;
};

type SerializedLargeGrant = {
  id: number;
  title: string;
  builderAddress: string;
  email: string;
  submitedAt?: string;
  type: "largeGrant";
  stages: Array<{
    id: number;
    stageNumber: number;
    status: string;
    submitedAt?: string;
    approvedAt?: string;
    milestones?: Array<{
      id: number;
      milestoneNumber: number;
      amount: number;
      status: string;
      proposedCompletionDate?: string;
      completedAt?: string;
      verifiedAt?: string;
      paidAt?: string;
    }>;
  }>;
};

type SerializedGrantData = SerializedGrant | SerializedLargeGrant;

type Props = {
  grants: SerializedGrantData[];
};

export default function ExportCSVButton({ grants }: Props) {
  // Try to fetch withdrawals, but don't block export if it fails
  const { data: withdrawalData, loading } = useQuery(WITHDRAWALS_QUERY, {
    fetchPolicy: "network-only",
    // Don't throw errors, just return empty data
    errorPolicy: "ignore",
  });

  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    // Escape double quotes and wrap in quotes if contains comma, newline, or quotes
    if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const generateCSV = () => {
    const headers = [
      "ID",
      "Project Name",
      "Submitted at",
      "Builder Address",
      "Email",
      "Stage",
      "Status",
      "Number of Milestones",
      "Currency",
      "Amount Requested",
      "Amount Granted",
      "Amount Paid",
      "Pending Payment",
    ];

    // Build withdrawal lookup for ETH grants (if available)
    const withdrawalsByGrantAndStage: Record<string, bigint> = {};
    if (withdrawalData?.withdrawals?.items) {
      withdrawalData.withdrawals.items.forEach((withdrawal: any) => {
        const key = `${withdrawal.grantNumber}-${withdrawal.stageNumber}`;
        const amount = BigInt(withdrawal.amount || 0);
        withdrawalsByGrantAndStage[key] = (withdrawalsByGrantAndStage[key] || 0n) + amount;
      });
    }

    const rows: string[][] = [headers];

    grants.forEach(grant => {
      if (grant.type === "grant") {
        // ETH Grant
        grant.stages.forEach(stage => {
          const stageKey = `${grant.grantNumber}-${stage.stageNumber}`;
          const withdrawn = withdrawalsByGrantAndStage[stageKey] || 0n;

          // If proposed or rejected, amount granted is 0
          const amountGranted =
            stage.status === "rejected" || stage.status === "proposed"
              ? 0n
              : stage.grantAmount
              ? BigInt(stage.grantAmount)
              : 0n;
          const pendingPayment = amountGranted - withdrawn;

          const numMilestones = stage.milestones?.length || 0;

          rows.push([
            escapeCSV(grant.id),
            escapeCSV(grant.title),
            escapeCSV(grant.submitedAt ? getFormattedDateWithDay(new Date(grant.submitedAt)) : ""),
            escapeCSV(grant.builderAddress),
            escapeCSV(grant.email),
            escapeCSV(stage.stageNumber),
            escapeCSV(stage.status),
            escapeCSV(numMilestones),
            escapeCSV("ETH"),
            escapeCSV(stage.stageNumber === 1 && grant.requestedFunds ? formatEther(BigInt(grant.requestedFunds)) : ""),
            escapeCSV(amountGranted ? formatEther(amountGranted) : "0"),
            escapeCSV(withdrawn ? formatEther(withdrawn) : "0"),
            escapeCSV(pendingPayment ? formatEther(pendingPayment) : "0"),
          ]);
        });
      } else if (grant.type === "largeGrant") {
        // USDC Grant
        grant.stages.forEach(stage => {
          const milestones = stage.milestones || [];
          const numMilestones = milestones.length;

          // Calculate total amount requested (sum of all milestone amounts)
          const amountRequested = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);

          // If proposed or rejected, amount granted is 0, otherwise same as requested
          const amountGranted = stage.status === "rejected" || stage.status === "proposed" ? 0 : amountRequested;

          // Calculate amount paid (sum of paid milestones - status === "paid")
          const amountPaid = milestones.filter(m => m.status === "paid").reduce((sum, m) => sum + (m.amount || 0), 0);

          const pendingPayment = amountGranted - amountPaid;

          rows.push([
            escapeCSV(grant.id),
            escapeCSV(grant.title),
            escapeCSV(grant.submitedAt ? getFormattedDateWithDay(new Date(grant.submitedAt)) : ""),
            escapeCSV(grant.builderAddress),
            escapeCSV(grant.email),
            escapeCSV(stage.stageNumber),
            escapeCSV(stage.status),
            escapeCSV(numMilestones),
            escapeCSV("USDC"),
            escapeCSV(amountRequested),
            escapeCSV(amountGranted),
            escapeCSV(amountPaid),
            escapeCSV(pendingPayment),
          ]);
        });
      }
    });

    return rows.map(row => row.join(",")).join("\n");
  };

  const handleDownload = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const filename = `grants_export_${new Date().toISOString().split("T")[0]}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`mb-6 self-end px-4 py-2 bg-green-600 text-white rounded ${
        loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
      }`}
    >
      {loading ? "Loading..." : "Export to CSV"}
    </button>
  );
}
