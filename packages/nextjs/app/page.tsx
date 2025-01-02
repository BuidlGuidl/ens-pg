import { ApprovedGrants } from "./_components/Grants";
import { WorkflowItem } from "./_components/WorkflowItem";
import { Stats } from "./_components/stats";
import type { NextPage } from "next";
import { Button } from "~~/components/pg-ens/Button";

export const revalidate = 21600; // 6 hours

const workflowItems = [
  {
    title: "Apply for a grant",
    description:
      "Start by sharing details of your project with us! Ensure your submission aligns with our eligibility criteria and clearly communicates the impact and usefulness of your project within the Ethereum or broader web3 ecosystem.",
  },
  {
    title: "Review process",
    description:
      "Once submitted, your application will be reviewed by the Public Goods Working Group stewards on a rolling basis. The stewards will evaluate your project based on its usefulness and impact.",
  },
  {
    title: "Deliver your milestones",
    description:
      "If your project is selected, you will begin working on the milestones outlined in your submission. While withdrawals do not need approval, each grant stage and its milestones will be reviewed by our stewards. Please ensure proof of completion is clear.",
  },
  {
    title: "Apply for another stage",
    description:
      "After you successfully complete your milestones, you may be eligible to apply for additional funding or future grant opportunities to continue developing and scaling your public good.",
  },
];

const Home: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow">
      <div className="max-w-4xl text-center px-4 py-8 sm:py-16">
        <h1 className="text-3xl font-extrabold !mb-0">ENS PG Builder Grants</h1>
        <div className="mt-4 max-w-2xl mx-auto space-y-4">
          <p>
            PG Builder Grants program is designed to support foundational public goods in the Ethereum and Web3
            ecosystems. The program aims to empower projects that have demonstrated exceptional usefulness and impact
            for developers and users alike.
          </p>
          <p>
            By providing significant financial support, we help projects continue to drive innovation and growth within
            the ecosystem. Whether you&apos;re building infrastructure, developing tools, or creating educational
            resources, PG Builder Grants offer a pathway to secure the funding you need to make a lasting difference.
          </p>
        </div>
        <Stats />
      </div>

      <div className="bg-secondary py-10 sm:py-20 px-4 flex flex-col items-center w-full">
        <h2 className="text-3xl font-black !mb-0">How does it work</h2>

        <div className="my-12 grid text-sm sm:grid-cols-2 xl:grid-cols-4 max-w-screen-2xl gap-8">
          {workflowItems.map(({ title, description }, idx) => (
            <WorkflowItem key={title} step={idx + 1} title={title} description={description} />
          ))}
        </div>
        <Button link href="/apply">
          Apply for a grant
        </Button>
      </div>

      <ApprovedGrants />
    </div>
  );
};

export default Home;
