import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, Path, useForm } from "react-hook-form";
import * as z from "zod";

export const getRequiredFields = (schema: z.AnyZodObject) => {
  const schemaShape = schema.shape;
  return Object.keys(schemaShape).filter(key => !schemaShape[key].isOptional());
};

export const useFormMethods = <FormValues extends FieldValues>({
  schema,
  defaultValues,
}: {
  schema: z.AnyZodObject;
  defaultValues?: any;
}) => {
  const formMethods = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const {
    formState: { errors },
  } = formMethods;

  const requiredFields = getRequiredFields(schema);

  const getCommonOptions = (name: Path<FormValues>) => {
    const splitName = name.split(".");

    const error = splitName.reduce<FieldValues | undefined>((acc, curr) => {
      if (!acc) return undefined;
      return acc[curr];
    }, errors as FieldValues);

    return {
      name,
      error: error?.message as string | undefined,
      required: requiredFields.includes(name),
    };
  };

  return {
    getCommonOptions,
    formMethods,
  };
};
