"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";
import { cn } from "@/lib/format";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(loginAction, {} as AuthState);

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
      />
      <PasswordField label="Password" name="password" autoComplete="current-password" />
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-navy py-3 text-sm font-medium text-white hover:bg-navy-mid disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-medium text-navy hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, {} as AuthState);
  const [password, setPassword] = useState(state.values?.password ?? "");
  const [confirmPassword, setConfirmPassword] = useState(state.values?.confirmPassword ?? "");

  useEffect(() => {
    if (state.values?.password != null) setPassword(state.values.password);
    if (state.values?.confirmPassword != null) setConfirmPassword(state.values.confirmPassword);
  }, [state.values?.password, state.values?.confirmPassword]);

  const longEnough = password.length >= 8;
  const matches = longEnough && password === confirmPassword;
  const canSubmit = longEnough && matches && !pending;

  return (
    <form action={action} className="mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          name="firstName"
          autoComplete="given-name"
          defaultValue={state.values?.firstName}
        />
        <Field
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          defaultValue={state.values?.lastName}
        />
      </div>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
      />
      <RegisterPasswordInput
        label="Password"
        name="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        valid={longEnough}
        touched={password.length > 0}
      />
      {password.length > 0 ? <Hint ok={longEnough} text="8 characters minimum" /> : null}
      <RegisterPasswordInput
        label="Confirm password"
        name="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        valid={matches}
        touched={confirmPassword.length > 0}
      />
      {confirmPassword.length > 0 ? (
        <Hint ok={matches} text={matches ? "Passwords match" : "Passwords do not match"} />
      ) : null}
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full bg-navy py-3 text-sm font-medium text-white hover:bg-navy-mid disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already a member?{" "}
        <Link href="/login" className="font-medium text-navy hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function RegisterPasswordInput({
  label,
  name,
  autoComplete,
  value,
  onChange,
  valid,
  touched,
}: {
  label: string;
  name: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  valid: boolean;
  touched: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={name} className="text-xs font-semibold tracking-wide text-muted uppercase">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-navy"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {visible ? "Hide password" : "Show password"}
        </button>
      </div>
      <input
        id={name}
        name={name}
        type={visible ? "text" : "password"}
        required
        minLength={8}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none",
          !touched
            ? "border-line focus:border-navy-soft"
            : valid
              ? "border-emerald-600 focus:border-emerald-600"
              : "border-red-600 focus:border-red-600",
        )}
      />
    </div>
  );
}

function Hint({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-sm", ok ? "text-emerald-700" : "text-red-700")}>
      {ok ? <Check className="size-4" /> : <X className="size-4" />}
      {text}
    </p>
  );
}

function PasswordField({
  label,
  name,
  autoComplete,
  defaultValue,
}: {
  label: string;
  name: string;
  autoComplete?: string;
  defaultValue?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
      {label}
      <span className="relative mt-1.5 block">
        <input
          key={`${name}-${defaultValue ?? ""}`}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          className="w-full rounded-lg border border-line bg-white py-2.5 pr-10 pl-3 text-sm font-normal text-ink outline-none focus:border-navy-soft"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted hover:text-navy"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
      </span>
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
      {label}
      <input
        key={`${name}-${defaultValue ?? ""}`}
        name={name}
        type={type}
        required
        minLength={type === "password" ? 8 : undefined}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-navy-soft"
      />
    </label>
  );
}
