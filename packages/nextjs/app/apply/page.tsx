"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateNewGrantReqBody } from "../api/grants/new/route";
import { ApplyFormValues, applyFormSchema } from "./schema";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation } from "@tanstack/react-query";
import type { NextPage } from "next";
import { FormProvider, useFieldArray } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { TrashIcon } from "@heroicons/react/20/solid";
import { Button } from "~~/components/pg-ens/Button";
import { FormInput } from "~~/components/pg-ens/form-fields/FormInput";
import { FormSelect } from "~~/components/pg-ens/form-fields/FormSelect";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { useAuthSession } from "~~/hooks/pg-ens/useAuthSession";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { postMutationFetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const Apply: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { data: session } = useAuthSession();
  const router = useRouter();

  const { formMethods, getCommonOptions } = useFormMethods<ApplyFormValues>({
    schema: applyFormSchema,
    defaultValues: {
      milestones: [{ description: "", proposedDeliverables: "", amount: 0 }],
    },
  });

  const { handleSubmit, control, watch } = formMethods;

  const { openConnectModal } = useConnectModal();
  const { isAuthenticated } = useAuthSession();

  const feedbackModalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.refresh();
    }
  }, [router, isAuthenticated]);

  const { mutateAsync: postNewGrant, isPending: isPostingNewGrant } = useMutation({
    mutationFn: (newGrant: CreateNewGrantReqBody) => postMutationFetcher("/api/grants/new", { body: newGrant }),
  });

  const onSubmit = async (fieldValues: ApplyFormValues) => {
    try {
      if (!connectedAddress) return notification.error("Please connect your wallet");

      const formattedBody = {
        ...fieldValues,
        milestones: fieldValues.milestones.map(milestone => ({
          ...milestone,
          requestedAmount: parseEther(milestone.requestedAmount),
        })),
      };

      await postNewGrant({
        ...formattedBody,
      });
      notification.success(`The grant proposal has been created`);
      feedbackModalRef.current?.showModal();
    } catch (error) {
      const errorMessage = getParsedError(error);
      notification.error(errorMessage);
    }
  };

  const handleModalClose = () => {
    feedbackModalRef.current?.close();
    router.push("/my-grants");
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  });

  const watchMilestones = watch("milestones");
  const totalAmount = watchMilestones.reduce((acc, curr) => acc + Number(curr.requestedAmount), 0);

  return (
    <div className="flex flex-col w-full items-center justify-center p-6 sm:p-10">
      <h2 className="text-2xl sm:text-3xl font-extrabold !mb-0">Apply for a grant</h2>
      <p className="text-center text-lg text-base-content/80 mt-4 max-w-2xl">
        Open to all public goods projects. ENS-specific projects should apply through the ENS Ecosystem Grants program
        instead.
      </p>
      <p className="text-center text-lg text-base-content/80 mt-4 max-w-2xl">
        Define your milestones and the budget for each one.
      </p>

      <dialog ref={feedbackModalRef} className="modal">
        <div className="modal-box flex flex-col space-y-3">
          <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4">
            <div className="flex items-center">
              <p className="font-bold text-xl m-0 text-center w-full">Application Submitted Successfully!</p>
            </div>
          </form>

          <div className="text-center">
            <p>
              Grant applications are reviewed at a regular cadence, you will receive information if we need more info,
              if the application was rejected and why, or approved and for what amount, based on the info submitted.
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={handleModalClose}>Accept</Button>
            </div>
          </div>
        </div>
        <Toaster />
      </dialog>

      <FormProvider {...formMethods}>
        <div className="mt-6 sm:mt-10 card card-compact rounded-xl w-full max-w-4xl bg-secondary shadow-lg mb-8 sm:mb-12 p-4 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="card-body gap-3 sm:gap-1">
            <FormInput label="Title" {...getCommonOptions("title")} />
            <FormTextarea label="Description" showMessageLength {...getCommonOptions("description")} />

            <div className="mt-4">
              <h3 className="text-2xl font-bold">Planned Milestones</h3>
              <div className="rounded-xl bg-light-purple p-4">
                {fields.map((field, index) => (
                  <div key={field.id}>
                    {index > 0 && <hr className="border-t border-white my-6" />}
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-2xl font-bold">Milestone {index + 1}</h4>
                      <Button variant="secondary" size="sm" onClick={() => remove(index)} className="ml-2">
                        <TrashIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete milestone</span>
                      </Button>
                    </div>
                    <FormTextarea
                      label="Description"
                      showMessageLength
                      {...getCommonOptions(`milestones.${index}.description`)}
                    />
                    <FormTextarea
                      label="Detail of Deliverables"
                      showMessageLength
                      {...getCommonOptions(`milestones.${index}.proposedDeliverables`)}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-16 sm:gap-y-1">
                      <FormSelect
                        label="Requested Funds (in ETH)"
                        options={["0.25", "0.5", "1", "2"]}
                        {...getCommonOptions(`milestones.${index}.requestedAmount`)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-16 sm:gap-y-1">
                <div className="pt-6">
                  <label className="text-xl font-bold">
                    Total requested funds:
                    <span className={`bg-light-purple ml-2 p-1 rounded ${totalAmount > 2 ? "text-red-500" : ""}`}>
                      {isNaN(totalAmount) ? "-" : totalAmount.toLocaleString()} ETH
                    </span>
                  </label>
                  {totalAmount > 2 && (
                    <p className="mb-0 mt-1 text-red-500">Note: Total requested funds should not exceed 2 ETH.</p>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() =>
                    append({
                      description: "",
                      proposedDeliverables: "",
                      requestedAmount: "0",
                    })
                  }
                  variant="purple-secondary"
                  className="mt-4"
                >
                  + Add Milestone
                </Button>
              </div>
            </div>

            <hr className="h-1 bg-white mt-4 mb-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-16 sm:gap-y-1">
              <FormInput label="Showcase Video Url" {...getCommonOptions("showcaseVideoUrl")} />
              <FormInput label="Github" {...getCommonOptions("github")} />
              <FormInput label="Email address" {...getCommonOptions("email")} />
              <FormInput label="Project or personal twitter" {...getCommonOptions("twitter")} />
              <FormInput label="Telegram handle" {...getCommonOptions("telegram")} />
            </div>
            {!session ? (
              <Button
                variant="primary"
                className="mt-4 self-center"
                type="button"
                onClick={e => {
                  e?.preventDefault();
                  openConnectModal?.();
                }}
              >
                Connect wallet
              </Button>
            ) : (
              <Button type="submit" disabled={isPostingNewGrant || totalAmount > 2} className="mt-4 self-center ">
                {isPostingNewGrant && <span className="loading loading-spinner"></span>}
                Submit
              </Button>
            )}
            <p className="text-center text-lg text-base-content/80 mt-4">
              We assess grants on a rolling basis, you can check the status of your grant in{" "}
              <Link href="/my-grants" target="_blank" className="text-primary hover:underline">
                /my-grants
              </Link>{" "}
              page, after the application is submitted.
            </p>
          </form>
        </div>
      </FormProvider>
    </div>
  );
};

export default Apply;
