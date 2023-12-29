import { Link, Form, useActionData } from "@remix-run/react";
import ShowIcon from "~/components/icons/ShowIcon";
import { useRef, useState } from "react";
import HideIcon from "~/components/icons/HideIcon";
import type { ActionFunctionArgs } from "react-router-dom";
import z from "zod";
import type { TypedResponse } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { FormError } from "~/utils/error.server";
import { register } from "~/model/auth.server";

type SignUpForm = z.infer<typeof SignUpSchema>;

const SignUpSchema = z.object({
  name: z.string().min(1, "Username is required"),
  email: z.string().trim().email("Email is not valid"),
  password: z.string().min(8, "Password is too short")
});

export async function action({
  request
}: ActionFunctionArgs): Promise<TypedResponse<FormError<SignUpForm, string>>> {
  const fields = Object.fromEntries(await request.formData());

  const parseResult = SignUpSchema.safeParse(fields);
  if (!parseResult.success) {
    return json({
      fields,
      errors: parseResult.error.format(),
      message: ""
    });
  }

  const registerResult = await register(request, parseResult.data);

  if (!registerResult?.ok) {
    return json({
      fields,
      message: registerResult.error.message
    });
  }

  return registerResult.data;
}

export default function SignUp() {
  const [showPassword, setShowPassword] = useState<"show" | "hide">("hide");
  const passwordRef = useRef<HTMLInputElement>(null);
  const actionData = useActionData<typeof action>();
  const fields = actionData?.fields;
  const fieldErrors = actionData?.errors;
  const errorMessage = actionData?.message;

  const passwordHandler = () => {
    if (showPassword === "show") {
      setShowPassword("hide");
      passwordRef.current!.type = "password";
    } else {
      setShowPassword("show");
      passwordRef.current!.type = "text";
    }
  };

  return (
    <Form className="field-container" method="POST">
      <h2 className="title">Register</h2>
      <div className="fields">
        <label htmlFor="name-input">Name</label>
        <input
          id="name-input"
          type="text"
          name="name"
          defaultValue={fields?.name ?? ""}
          required
        />
      </div>
      {fieldErrors?.name?._errors && (
        <p className="error">{fieldErrors?.name?._errors[0]}</p>
      )}

      <div className="fields">
        <label htmlFor="email-input">Email</label>
        <input
          id="email-input"
          type="email"
          name="email"
          defaultValue={fields?.email ?? ""}
          required
        />
      </div>
      {fieldErrors?.email?._errors && (
        <p className="error">{fieldErrors?.email?._errors[0]}</p>
      )}

      <div className="fields">
        <label htmlFor="password-input">Password</label>
        <div className="flex items-center gap-2 bg-white rounded-[.5rem] border-[2px] border-[var(--primary-color)]">
          <input
            id="password-input"
            className="password-input"
            type="password"
            ref={passwordRef}
            name="password"
            defaultValue={fields?.password ?? ""}
            required
          />
          <button type="button" onClick={passwordHandler}>
            {showPassword === "show" ? <ShowIcon /> : <HideIcon />}
          </button>
        </div>
      </div>
      {fieldErrors?.password?._errors && (
        <p className="error">{fieldErrors?.password?._errors[0]}</p>
      )}

      {errorMessage && <p>{errorMessage}</p>}

      <button className="button">
        <span>Sign Up</span>
      </button>

      <div className="flex flex-col">
        <p className="text-white">
          Already have an account ?
          <Link
            to={"/login"}
            className="text-yellow-500 mx-1 hover:text-gray-300 transition-all duration-75"
          >
            Login
          </Link>
        </p>
      </div>
    </Form>
  );
}
