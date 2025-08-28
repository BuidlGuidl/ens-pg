import { formatEther } from "viem";
import { statusText } from "~~/components/pg-ens/BadgeMilestone";
import { AdminGrant } from "~~/types/utils";
import { getFormattedDateWithDay } from "~~/utils/getFormattedDate";
import { multilineStringToMarkdown } from "~~/utils/multiline-string-to-markdown";

export function ExportGrantMarkdown({ grant }: { grant: AdminGrant }) {
  let md = `## ETH Grant: ${grant.title}\n`;
  md += `- **ID:** ${grant.id}\n`;
  md += `- **Builder:** ${grant.builderAddress}\n`;
  if (grant.submitedAt) {
    md += `- **Submitted At:** ${getFormattedDateWithDay(grant.submitedAt)}\n`;
  }
  if (grant.showcaseVideoUrl) {
    md += `- **Showcase Video URL:** ${grant.showcaseVideoUrl}\n`;
  }
  md += `- **GitHub:** ${grant.github}\n`;
  md += `- **Email:** ${grant.email}\n`;
  md += `- **Twitter:** ${grant.twitter}\n`;
  md += `- **Telegram:** ${grant.telegram}\n`;
  md += `### Description\n${multilineStringToMarkdown(grant.description)}\n\n`;

  md += `### Stages\n`;
  grant.stages.forEach(stage => {
    md += `#### Stage ${stage.stageNumber} (${stage.status})\n`;

    if (stage.stageNumber === 1 && grant.requestedFunds) {
      md += `- **Grant Requested Amount:** ${formatEther(grant.requestedFunds)} ETH\n`;
    }

    if ("grantAmount" in stage && stage.grantAmount) {
      md += `- **Grant Amount:** ${formatEther(stage.grantAmount)} ETH\n`;
    }

    if (stage.privateNotes?.length) {
      md += `##### Private Notes\n`;
      stage.privateNotes.forEach(note => {
        md += `- ${multilineStringToMarkdown(note.note)} (by ${note.authorAddress})\n`;
      });
    }

    if ("milestones" in stage && Array.isArray(stage.milestones) && stage.milestones.length) {
      md += `##### Milestones\n\n`;
      stage.milestones.forEach(milestone => {
        md += `###### Milestone ${milestone.milestoneNumber} (${statusText[milestone.status]})\n`;
        md += `- **Description:** ${multilineStringToMarkdown(milestone.description)}\n`;
        md += `- **Proposed Deliverables:** ${multilineStringToMarkdown(milestone.proposedDeliverables)}\n`;
        md += `- **Requested Amount:** ${formatEther(milestone.requestedAmount)} ETH\n`;

        if (milestone.grantedAmount) {
          md += `- **Granted Amount:** ${formatEther(milestone.grantedAmount)} ETH\n`;
        }
        if (milestone.completedAt) {
          md += `- **Completed At:** ${getFormattedDateWithDay(milestone.completedAt)}\n`;
        }
        if (milestone.completionProof) {
          md += `- **Completion Proof:** ${milestone.completionProof}\n`;
        }
        if (milestone.statusNote) {
          md += `- **Status Note:** ${multilineStringToMarkdown(milestone.statusNote)}\n`;
        }
        if (milestone.paymentTx) {
          md += `- **Payment Tx:** https://optimistic.etherscan.io/tx/${milestone.paymentTx}\n`;
        }
      });
    } else {
      if (stage.stageNumber > 1) {
        md += `##### Milestones\n\n ${
          "milestone" in stage && stage.milestone ? multilineStringToMarkdown(stage.milestone) : ""
        }\n`;
      } else if (grant.milestones) {
        md += `##### Milestones\n\n  ${multilineStringToMarkdown(grant.milestones)}\n`;
      }
    }
  });
  md += "\n";
  return md;
}
