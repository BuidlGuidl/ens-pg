import { LargeGrantWithStages } from "../../page";
import { GrantDetailsField } from "./GrantDetailsField";
import { getServerSession } from "next-auth";
import { Address } from "~~/components/scaffold-eth";
import { authOptions } from "~~/utils/auth";

type GrantDetailsProps = {
  grant: NonNullable<LargeGrantWithStages>;
};

export const GrantDetails = async ({ grant }: GrantDetailsProps) => {
  const session = await getServerSession(authOptions);
  const openByDefault = session?.user.role === "admin" && session?.user.address !== grant.builderAddress;

  return (
    <div className="collapse !mt-0 bg-base-200 collapse-arrow max-w-5xl">
      <input type="checkbox" defaultChecked={openByDefault} />

      <div className="collapse-title text-lg text-primary w-60 mx-auto h-[60px]">
        <div className="-mr-2">See submission details</div>
      </div>

      <div className="collapse-content bg-white rounded-xl">
        <div className="px-4 pt-4 sm:px-12 sm:pt-12 pb-8 flex flex-col gap-4">
          <GrantDetailsField
            title="Builder Address"
            description={<Address address={grant.builderAddress as `0x${string}`} />}
          />
          <GrantDetailsField title="Title" description={grant.title} />
          <GrantDetailsField title="Description" description={grant.description} />
          <div className="grid sm:grid-cols-2 sm:gap-x-16 gap-y-4">
            <GrantDetailsField title="Showcase Video Url" description={grant.showcaseVideoUrl || "-"} />
            <GrantDetailsField title="Github" description={grant.github} />
            <GrantDetailsField title="Email address" description={grant.email} />
            <GrantDetailsField title="Project or personal twitter" description={grant.twitter || "-"} />
            <GrantDetailsField title="Telegram handle" description={grant.telegram || "-"} />
          </div>
        </div>
      </div>
    </div>
  );
};
