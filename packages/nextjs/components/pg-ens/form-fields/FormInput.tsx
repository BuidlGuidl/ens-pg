import { ChangeEventHandler } from "react";
import { FormErrorMessage } from "./FormErrorMessage";
import { useFormContext, useWatch } from "react-hook-form";
import { DEFAULT_INPUT_MAX_LENGTH } from "~~/utils/forms";

type FormInputProps = {
  label?: string;
  name: string;
  error?: string;
  required?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export const FormInput = ({ error, label, name, required, onChange }: FormInputProps) => {
  const { register, control } = useFormContext();
  useWatch({ control, name });
  const registerProps = register(name);

  return (
    <div>
      <label>
        {label && (
          <span className="text-xl font-bold">
            {label}
            {required ? "*" : ""}
          </span>
        )}
        <input
          {...registerProps}
          onChange={onChange || registerProps.onChange}
          className={`input input-bordered mt-1 w-full${error ? " input-error" : ""}`}
          autoComplete="off"
          maxLength={DEFAULT_INPUT_MAX_LENGTH}
        />
      </label>
      <FormErrorMessage error={error} />
    </div>
  );
};
