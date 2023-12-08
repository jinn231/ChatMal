import type { ZodFormattedError } from "zod";

export type FormError<T, U> = {
  fields: Partial<T>;
  errors?: ZodFormattedError<T>;
  message?: U;
};
