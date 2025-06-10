import { statusText } from "~~/components/pg-ens/BadgeMilestone";
import { AdminLargeGrant } from "~~/types/utils";
import { getFormattedDateWithDay, getFormattedDeadline } from "~~/utils/getFormattedDate";
import { multilineStringToMarkdown } from "~~/utils/multiline-string-to-markdown";

export function ExportLargeGrantMarkdown({ grant }: { grant: AdminLargeGrant }) {
  let md = `## USDC Grant: ${grant.title}\n`;
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

    if (stage.privateNotes?.length) {
      md += `##### Stage Private Notes\n`;
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
        md += `- **Amount:** ${milestone.amount.toLocaleString()} USDC\n`;

        if (milestone.proposedCompletionDate) {
          md += `- **Deadline:** ${getFormattedDeadline(milestone.proposedCompletionDate)}\n`;
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
        if (milestone.verifiedAt) {
          md += `- **Initial Approved At:** ${getFormattedDateWithDay(milestone.verifiedAt)}\n`;
        }
        if (milestone.verifiedBy) {
          md += `- **Initial Approved By:** ${milestone.verifiedBy}\n`;
        }
        if (milestone.paidAt) {
          md += `- **Final Approved At:** ${getFormattedDateWithDay(milestone.paidAt)}\n`;
        }
        if (milestone.paidBy) {
          md += `- **Final Approved By:** ${milestone.paidBy}\n`;
        }
        if (milestone.paymentTx) {
          md += `- **Payment Tx:** https://optimistic.etherscan.io/tx/${milestone.paymentTx}\n`;
        }
        if (milestone.privateNotes?.length) {
          md += `- **Milestone Private Notes:**\n`;
          milestone.privateNotes.forEach(note => {
            md += `  - ${multilineStringToMarkdown(note.note)} (by ${note.authorAddress})\n`;
          });
        }
      });
    }
  });
  md += "\n";
  return md;
}
