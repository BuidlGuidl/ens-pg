import type { NextPage } from "next";

const FAQ: NextPage = () => {
  const faqSections = [
    {
      title: "Understanding Our Platform",
      questions: [
        {
          question: "What is the Builder Grants platform?",
          answer:
            "The Builder Grants platform provides continuous funding for public goods projects in the Ethereum and Web3 ecosystems. We've designed it to support projects at every stage of development, whether you're just starting or ready to scale your impact. Our mission is to help builders create lasting value for the broader Web3 community through sustainable, milestone-driven funding.",
        },
        {
          question: "Why did you create this platform?",
          answer:
            "We recognize that public goods funding shouldn&apos;t be seasonal or fragmented. The Builder Grants platform combines our previous Small and Large Grants programs into a streamlined experience. This unified approach means builders have a clear pathway to funding without navigating multiple programs or waiting for specific seasons to open.",
        },
      ],
    },
    {
      title: "Eligibility and Focus",
      questions: [
        {
          question: "What kinds of projects do you fund?",
          answer: (
            <div className="space-y-2">
              <p>We focus on three core areas that strengthen the Web3 ecosystem:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Infrastructure</strong>: Protocol improvements and developer tools for Ethereum
                </li>
                <li>
                  <strong>Utility</strong>: Projects solving real problems for Web3 users and developers
                </li>
                <li>
                  <strong>Education</strong>: Initiatives that help people understand and use Web3 technologies
                </li>
              </ul>
            </div>
          ),
        },
        {
          question: "What makes a project ineligible for funding?",
          answer: (
            <div className="space-y-2">
              <p>
                We&apos;ve learned that certain types of projects are better suited for other funding sources. We do not
                fund:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Projects with token launches</li>
                <li>Financial products or DeFi tools</li>
                <li>Gambling, gaming, or asset tokenization</li>
                <li>Community events without a proven track record</li>
                <li>
                  <strong>ENS-focused projects</strong> - While we welcome projects that integrate with ENS, those
                  primarily focused on ENS functionality should apply to our ENS Ecosystem Working Group instead. This
                  helps ensure you receive the most appropriate support and guidance.
                </li>
              </ul>
            </div>
          ),
        },
      ],
    },
    {
      title: "Application Process",
      questions: [
        {
          question: "How do I apply for funding?",
          answer:
            "Start by visiting the Builder Grants Platform, connect your wallet and complete our application form.",
        },
        {
          question: "What makes a compelling application?",
          answer:
            "The key to a strong application is clarity about your project's impact. Explain the problem, how you'll solve it, and why it matters to the Web3 ecosystem. Include specific milestones that show how you'll turn your vision into reality. Focus on telling your project's story. Share concrete evidence of your ability to execute— past projects, technical prototypes, or community feedback. Most importantly, outline clear, achievable milestones demonstrating how you'll create impact over time.",
        },
      ],
    },
    {
      title: "Funding Structure",
      questions: [
        {
          question: "How much funding is available?",
          answer:
            "Projects can currently request between 0.25 ETH and 2 ETH. We're actively working to add USDC as a payment option to provide more flexibility. The amount granted may be adjusted during review based on our evaluation of your project's scope and potential impact.",
        },
        {
          question: "How does milestone-based funding work?",
          answer:
            "Rather than providing all funds upfront, we release funding as you achieve specific milestones. This approach helps ensure sustained progress while providing regular opportunities for feedback and support. You'll work with our team to define meaningful milestones that align with your project's goals and our evaluation criteria.",
        },
      ],
    },
    {
      title: "Evaluation Process",
      questions: [
        {
          question: "How do you evaluate applications?",
          answer: (
            <div className="space-y-2">
              <p>
                Our evaluation focuses on two key aspects: <strong>usefulness and impact</strong>.
              </p>
              <p>
                When assessing usefulness, we look at how valuable your project is to the Ethereum/Web3 ecosystem—does
                it solve a significant problem? Will it make something meaningful easier or better?
              </p>
              <p>
                For impact, we examine the reach and effectiveness of your solution—how many people can benefit? What
                evidence have you provided to suggest your approach will work? We are particularly interested in
                projects demonstrating potential for long-term, sustainable impact.
              </p>
            </div>
          ),
        },
        {
          question: "How long does the review process take?",
          answer:
            "Our Public Goods Working Group stewards review applications regularly. You can track your application status directly via the dashboard. We'll also communicate directly via comments if we need any additional information. We aim to provide clear, constructive feedback regardless of the outcome.",
        },
      ],
    },
    {
      title: "After Approval",
      questions: [
        {
          question: "What happens after my project is approved?",
          answer:
            "Once approved, you&apos;ll receive information about the next steps, including milestone tracking and payment schedules. All transactions are recorded on-chain for transparency.",
        },
        {
          question: "How do I report progress?",
          answer:
            "The platform includes built-in tools for tracking and reporting progress on your milestones. You should provide regular updates, share evidence of completion and join the weekly PG calls to share these.",
        },
      ],
    },
    {
      title: "Support and Resources",
      questions: [
        {
          question: "How can I get help with my application?",
          answer:
            "We believe in supporting builders throughout their journey. Attend our weekly public goods working group calls to learn more about what we seek. For technical issues with the platform itself, the PG team is ready to help get you back on track.",
        },
        {
          question: "Where can I learn more?",
          answer: (
            <div>
              <p>The best way to understand our ecosystem is to engage with it:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Follow our updates on Twitter{" "}
                  <a
                    href="https://twitter.com/ens_dao"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @ens_dao
                  </a>
                </li>
                <li>
                  <a
                    href="https://discuss.ens.domains/t/ens-public-goods-weekly-meeting-12pm-et-5pm-utc-thursday-term-6/20065/56"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Attend our weekly working group calls
                  </a>{" "}
                  for more info on all Public Goods related topics
                </li>
                <li>
                  You can also review previously funded projects on the platform to better understand the types of
                  initiatives we support.
                </li>
              </ul>
              <p className="mt-4">
                Remember, we&apos;re here to help you succeed in creating valuable public goods for Web3.
              </p>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col items-center pt-10 px-4 sm:px-8 lg:px-12 pb-16">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl text-center font-extrabold">Frequently Asked Questions</h1>
        <p className="text-center text-lg mb-10">Learn more about the ENS Builder Grants Platform.</p>

        <div className="flex flex-col gap-12">
          {faqSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-6">
              <h2 className="text-2xl font-bold text-primary text-center sm:text-left">{section.title}</h2>
              <div className="flex flex-col gap-4">
                {section.questions.map((faq, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-base-300">
                    <h3 className="text-xl font-semibold mb-4">{faq.question}</h3>
                    <div className="text-neutral-600 max-w-none">
                      {typeof faq.answer === "string" ? <p>{faq.answer}</p> : faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
