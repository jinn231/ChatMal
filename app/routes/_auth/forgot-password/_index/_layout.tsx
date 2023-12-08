import type { ActionFunctionArgs, TypedResponse } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { z } from "zod";
import { getUserByEmail } from "~/model/user.server";
import type { FormError } from "~/utils/error.server";
import { Result } from "~/utils/result.server";

type ForgotPasswordForm = z.infer<typeof ForgotPasswordSchema>;

const ForgotPasswordSchema = z.object({
  email: z.string().trim().email("Email is not valid"),
});

export async function action({
  request,
}: ActionFunctionArgs): Promise<
  TypedResponse<Result<null, FormError<ForgotPasswordForm, string>>>
> {
  const fields = Object.fromEntries(await request.formData());

  const parsedResult = ForgotPasswordSchema.safeParse(fields);

  if (!parsedResult.success) {
    return json({
      ok: false,
      error: {
        fields,
        errors: parsedResult.error.format(),
        message: "",
      },
    });
  }

  const { email } = parsedResult.data;

  const user = await getUserByEmail(email);

  if (user === null) {
    return json({
      ok: false,
      error: {
        fields,
        message: "User with this email does not exist",
      },
    });
  }

  return json({ ok: true, data: null });

  // Generate token for password reset
  // Send Email
}

export default function ForgotPasswordRoute() {
  const actionData = useActionData<typeof action>();
  const fieldsError = !actionData?.ok ? actionData?.error.errors : null;
  const errorMessage = !actionData?.ok ? actionData?.error.message : null;

  if(actionData?.ok){
    return (
      <div className="text-[var(--primary-color)]">
        <h2 className="text-2xl ">Password reset link is successfully sent to your email</h2>
        <p>Link will be expired in 1 hr</p>
      </div>
    )
  }

  return (
    <Form className="field-container" method="POST">
      <h2 className="title">Reset Password</h2>
      <div className="fields">
        <label htmlFor="email-input">Email</label>
        <input id="email-input" type="email" name="email" />
      </div>
      {fieldsError?.email?._errors[0] && (
        <p className="error">{fieldsError.email._errors[0]}</p>
      )}
      {errorMessage && <p className="error">{errorMessage}</p>}
      <button className="bg-[var(--primary-color)] p-2 rounded-[.5rem]">
        <span className="active:scale-90">Find User with email</span>
      </button>
    </Form>
  );
}
