import { ExportGrantMarkdown } from "./ExportGrantMarkdown";
import { ExportLargeGrantMarkdown } from "./ExportLargeGrantMarkdown";
import ExportMarkdownButton from "./ExportMarkdownButton";
import { getAllGrants } from "~~/services/database/repositories/grants";
import { getAllLargeGrants } from "~~/services/database/repositories/large-grants";
import type { DiscriminatedAdminGrant } from "~~/types/utils";

export default async function ExportGrantsToMarkdown() {
  const grants = (await getAllGrants()).map(grant => ({ ...grant, type: "grant" }));
  const largeGrants = (await getAllLargeGrants()).map(grant => ({
    ...grant,
    type: "largeGrant",
  }));
  const allGrants = ([...grants, ...largeGrants] as DiscriminatedAdminGrant[]).sort(
    (a, b) => (b.submitedAt?.getTime() ?? 0) - (a.submitedAt?.getTime() ?? 0),
  );

  function generateMarkdown() {
    let md = "# Grants Export\n\n";
    allGrants.forEach(grant => {
      if (grant.type === "grant") {
        md += ExportGrantMarkdown({ grant });
      } else if (grant.type === "largeGrant") {
        md += ExportLargeGrantMarkdown({ grant });
      }
    });

    return md;
  }

  return <ExportMarkdownButton markdown={generateMarkdown()} />;
}
