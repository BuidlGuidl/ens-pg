"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateNewGrantReqBody } from "../api/grants/new/route";
import { ApplyFormValues, applyFormSchema } from "./schema";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation } from "@tanstack/react-query";
import type { NextPage } from "next";
import { FormProvider } from "react-hook-form";
import { useAccount } from "wagmi";
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
  const { formMethods, getCommonOptions } = useFormMethods<ApplyFormValues>({ schema: applyFormSchema });
  const { handleSubmit } = formMethods;

  const { openConnectModal } = useConnectModal();
  const { isAuthenticated } = useAuthSession();

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

      await postNewGrant({
        ...fieldValues,
      });
      notification.success(`The grant proposal has been created`);
      router.push("/my-grants");
    } catch (error) {
      const errorMessage = getParsedError(error);
      notification.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center p-6 sm:p-10">
      <h2 className="text-2xl sm:text-3xl font-extrabold !mb-0">Apply for a grant</h2>
      <p className="text-center text-lg text-base-content/80 mt-4 max-w-2xl">
        Open to all public goods projects. ENS-specific projects should apply through the ENS Ecosystem Grants program
        instead.
      </p>

      <FormProvider {...formMethods}>
        <div className="mt-6 sm:mt-10 card card-compact rounded-xl w-full max-w-4xl bg-secondary shadow-lg mb-8 sm:mb-12 p-4 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="card-body gap-3 sm:gap-1">
            <FormInput label="Title" {...getCommonOptions("title")} />
            <FormTextarea label="Description" showMessageLength {...getCommonOptions("description")} />
            <FormTextarea label="Planned Milestones" showMessageLength {...getCommonOptions("milestones")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-16 sm:gap-y-1">
              <FormSelect
                label="Requested Funds (in ETH)"
                options={["0.25", "0.5", "1", "2"]}
                {...getCommonOptions("requestedFunds")}
              />
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
              <Button type="submit" disabled={isPostingNewGrant} className="mt-4 self-center ">
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
