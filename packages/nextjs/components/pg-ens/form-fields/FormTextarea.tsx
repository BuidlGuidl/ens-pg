import { FormErrorMessage } from "./FormErrorMessage";
import { useFormContext, useWatch } from "react-hook-form";
import { DEFAULT_TEXTAREA_MAX_LENGTH } from "~~/utils/forms";

type FormTextareaProps = {
  label?: string;
  name: string;
  showMessageLength?: boolean;
  error?: string;
  required?: boolean;
};

export const FormTextarea = ({ error, label, name, showMessageLength, required }: FormTextareaProps) => {
  const { register, control } = useFormContext();
  const message = useWatch({ control, name });

  return (
    <div>
      <label>
        {label && (
          <span className="text-xl font-bold">
            {label}
            {required ? "*" : ""}
          </span>
        )}
        <textarea
          {...register(name)}
          className={`textarea textarea-bordered mt-1 w-full${error ? " textarea-error" : ""} min-h-[180px]`}
          autoComplete="off"
          maxLength={DEFAULT_TEXTAREA_MAX_LENGTH}
        />
        {showMessageLength && (
          <div>
            {message?.length || 0} / {DEFAULT_TEXTAREA_MAX_LENGTH}
          </div>
        )}
      </label>
      <FormErrorMessage error={error} />
    </div>
  );
};
