"use client";

import { ReactNode } from "react";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

type GrantDetailsFieldProps = {
  title: string;
  description: ReactNode;
};

export const GrantDetailsField = ({ title, description }: GrantDetailsFieldProps) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-bold text-xl">{title}</span>
      <div className="flex flex-col">
        {typeof description === "string" ? multilineStringToTsx(description) : description}
      </div>
    </div>
  );
};
