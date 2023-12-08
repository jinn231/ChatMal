import { Form, Link, useActionData } from "@remix-run/react";
import { useRef, useState } from "react";
import HideIcon from "~/components/icons/HideIcon";
import ShowIcon from "~/components/icons/ShowIcon";
import z from "zod";
import type { ActionFunctionArgs, TypedResponse} from "@remix-run/node";
import { json } from "@remix-run/node";
import type { FormError } from "~/utils/error.server";
import { login } from "~/model/auth.server";

type LoginForm = z.infer<typeof LoginSchema>;

const LoginSchema = z.object({
  email: z.string().trim().email("Email is not valid"),
  password: z.string().min(8, "Password is too short"),
});

export async function action({
  request,
}: ActionFunctionArgs): Promise<TypedResponse<FormError<LoginForm, string>>> {
  const fields = Object.fromEntries(await request.formData());

  const parseResult = LoginSchema.safeParse(fields);
  if (!parseResult.success) {
    return json({
      fields,
      errors: parseResult.error.format(),
      message: "",
    });
  }

  const loginResult = await login(parseResult.data);

  if (!loginResult?.ok) {
    return json({
      fields,
      message: loginResult.error.message,
    });
  }

  return loginResult.data;
}

export default function LoginRoute() {
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
      <h2 className="title">Login</h2>
      <div className="fields">
        <label htmlFor="email-input">Email</label>
        <input
          id="email-input"
          type="email"
          name="email"
          defaultValue={fields?.email ?? ""}
        />
      </div>
      {fieldErrors?.email?._errors[0] && (
        <p className="error">{fieldErrors.email._errors[0]}</p>
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
          />
          <button type="button" onClick={passwordHandler}>
            {showPassword === "show" ? <ShowIcon /> : <HideIcon />}
          </button>
        </div>
      </div>
      {fieldErrors?.password?._errors[0] && (
        <p className="error">{fieldErrors.password._errors[0]}</p>
      )}
      {errorMessage && <p className="error">{errorMessage}</p>}

      <button className="button">
        <span>Login</span>
      </button>

      <div className="flex flex-col">
        <p className="text-white">
          Don't you hve an account ?
          <Link
            to={"/sign-up"}
            className="text-yellow-500 mx-1 hover:text-gray-300 transition-all duration-75"
          >
            Sign Up
          </Link>
        </p>
        <Link
          to="/forgot-password"
          className="text-yellow-500 hover:text-gray-300 transition-all duration-75"
        >
          Forgot password
        </Link>
      </div>
    </Form>
  );
}
