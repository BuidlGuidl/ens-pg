"use client";

import { useState } from "react";
import { GrantItem } from "./GrantItem";
import { LargeGrantItem } from "./LargeGrantItem";
import { Pagination } from "~~/components/pg-ens/Pagination";
import { PublicGrant } from "~~/services/database/repositories/grants";
import { PublicLargeGrant } from "~~/services/database/repositories/large-grants";

const GRANTS_PER_PAGE = 8;

// Add a discriminator property to distinguish between PublicGrant and PublicLargeGrant
type DiscriminatedGrant = (PublicGrant & { type: "grant" }) | (PublicLargeGrant & { type: "largeGrant" });
type ApprovedGrantsListProps = {
  approvedGrants: DiscriminatedGrant[];
};

export const ApprovedGrantsList = ({ approvedGrants }: ApprovedGrantsListProps) => {
  const [currentListPage, setCurrentListPage] = useState(1);

  const currentListApprovedGrants = approvedGrants.slice(
    (currentListPage - 1) * GRANTS_PER_PAGE,
    currentListPage * GRANTS_PER_PAGE,
  );

  return (
    <>
      <div className="my-10 grid sm:grid-cols-2 xl:grid-cols-4 gap-8 w-full max-w-96 sm:max-w-[50rem] xl:max-w-screen-2xl">
        {currentListApprovedGrants.map(grant =>
          grant.type === "largeGrant" ? (
            <LargeGrantItem key={grant.id} grant={grant} latestsShownStatus="approved" />
          ) : (
            <GrantItem key={grant.id} grant={grant} latestsShownStatus="approved" />
          ),
        )}
      </div>

      <Pagination
        currentListPage={currentListPage}
        setCurrentListPage={setCurrentListPage}
        itemsAmount={approvedGrants.length}
        itemsPerPage={GRANTS_PER_PAGE}
      />
    </>
  );
};
