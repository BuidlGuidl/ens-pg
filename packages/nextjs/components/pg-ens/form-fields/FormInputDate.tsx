import { FormErrorMessage } from "./FormErrorMessage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useFormContext } from "react-hook-form";

type FormInputProps = {
  label?: string;
  name: string;
  error?: string;
  required?: boolean;
};

export const FormInputDate = ({ error, label, name, required }: FormInputProps) => {
  const { setValue, watch } = useFormContext();
  const dateValue = watch(name);

  return (
    <div className="form-control">
      <label className="text-xl font-bold">
        {label}
        {required ? "*" : ""}
      </label>
      <DatePicker
        selected={dateValue ? new Date(dateValue) : null}
        onChange={date => setValue(name, date)}
        className={`input input-bordered mt-1 w-full${error ? " input-error" : ""}`}
        disabledKeyboardNavigation
        dateFormat="d MMM yyyy"
      />
      <FormErrorMessage error={error} />
    </div>
  );
};
