import { FormErrorMessage } from "./FormErrorMessage";
import { useFormContext, useWatch } from "react-hook-form";

type FormInputProps = {
  label?: string;
  name: string;
  error?: string;
  required?: boolean;
};

export const FormInputNumber = ({ error, label, name, required }: FormInputProps) => {
  const { register, control } = useFormContext();
  useWatch({ control, name });

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
          {...register(name)}
          className={`input input-bordered mt-1 w-full${error ? " input-error" : ""}`}
          autoComplete="off"
          type="number"
          min="1"
          placeholder="0"
        />
      </label>
      <FormErrorMessage error={error} />
    </div>
  );
};
