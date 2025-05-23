import { statusText } from "~~/components/pg-ens/BadgeMilestone";
import { AdminLargeGrant } from "~~/types/utils";
import { getFormattedDateWithDay, getFormattedDeadline } from "~~/utils/getFormattedDate";

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
  md += `### Description\n${grant.description}\n\n`;

  md += `### Stages\n`;
  grant.stages.forEach(stage => {
    md += `#### Stage ${stage.stageNumber} (${stage.status})\n`;

    if ("milestones" in stage && Array.isArray(stage.milestones) && stage.milestones.length) {
      md += `##### Milestones\n\n`;
      stage.milestones.forEach(milestone => {
        md += `###### Milestone ${milestone.milestoneNumber} (${statusText[milestone.status]})\n`;
        md += `- **Description:** ${milestone.description}\n`;
        md += `- **Detail of Deliverables:** ${milestone.proposedDeliverables}\n`;
        md += `- **Amount:** ${milestone.amount.toLocaleString()} USDC\n`;

        if (milestone.privateNotes?.length) {
          md += `####### Private Notes\n`;
          milestone.privateNotes.forEach(note => {
            md += `- ${note.note} (by ${note.authorAddress})\n`;
          });
        }

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
          md += `- **Status Note:** ${milestone.statusNote}\n`;
        }
        if (milestone.verifiedAt) {
          md += `- **Verified At:** ${getFormattedDateWithDay(milestone.verifiedAt)}\n`;
        }
        if (milestone.verifiedBy) {
          md += `- **Verified By:** ${milestone.verifiedBy}\n`;
        }
        if (milestone.paidAt) {
          md += `- **Paid At:** ${getFormattedDateWithDay(milestone.paidAt)}\n`;
        }
        if (milestone.paidBy) {
          md += `- **Paid By:** ${milestone.paidBy}\n`;
        }
        if (milestone.paymentTx) {
          md += `- **Payment Tx:** https://optimistic.etherscan.io/tx/${milestone.paymentTx}\n`;
        }
      });
    }

    if (stage.privateNotes?.length) {
      md += `##### Private Notes\n`;
      stage.privateNotes.forEach(note => {
        md += `- ${note.note} (by ${note.authorAddress})\n`;
      });
    }
  });
  md += "\n";
  return md;
}
