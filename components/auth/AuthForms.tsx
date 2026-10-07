"use client";

import { useActionState, useState } from "react";
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
  const [firstName, setFirstName] = useState(state.values?.firstName ?? "");
  const [lastName, setLastName] = useState(state.values?.lastName ?? "");
  const [email, setEmail] = useState(state.values?.email ?? "");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState(state.values?.password ?? "");
  const [confirmPassword, setConfirmPassword] = useState(state.values?.confirmPassword ?? "");
  const [accountType, setAccountType] = useState<"reader" | "author">(
    state.values?.accountType === "author" ? "author" : "reader",
  );
  const [syncedValues, setSyncedValues] = useState(state.values);
  if (state.values !== syncedValues) {
    setSyncedValues(state.values);
    if (state.values?.firstName != null) setFirstName(state.values.firstName);
    if (state.values?.lastName != null) setLastName(state.values.lastName);
    if (state.values?.email != null) setEmail(state.values.email);
    if (state.values?.password != null) setPassword(state.values.password);
    if (state.values?.confirmPassword != null) setConfirmPassword(state.values.confirmPassword);
    if (state.values?.accountType != null) setAccountType(state.values.accountType);
  }

  const namesFilled = firstName.trim().length > 0 && lastName.trim().length > 0;
  const emailValid = isEmail(email);
  const longEnough = password.length >= 8;
  const matches = longEnough && password === confirmPassword;
  const canSubmit = namesFilled && emailValid && longEnough && matches && !pending;

  return (
    <form action={action} className="mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          name="firstName"
          autoComplete="given-name"
          value={firstName}
          onChange={setFirstName}
          requiredMark
        />
        <Field
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          value={lastName}
          onChange={setLastName}
          requiredMark
        />
      </div>
      <fieldset>
        <legend className="text-xs font-semibold tracking-wide text-muted uppercase">I am joining as</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["reader", "Reader"],
              ["author", "Author"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-2 text-center text-sm",
                accountType === value
                  ? "border-navy bg-navy text-white"
                  : "border-line bg-white text-navy-mid",
              )}
            >
              <input
                type="radio"
                name="accountType"
                value={value}
                checked={accountType === value}
                onChange={() => setAccountType(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        onBlur={() => setEmailTouched(true)}
        requiredMark
      />
      {emailTouched && !emailValid ? <Hint ok={false} text="Enter a valid email" /> : null}
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

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
  value,
  onChange,
  onBlur,
  requiredMark = false,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  requiredMark?: boolean;
}) {
  const controlled = value != null && onChange != null;

  return (
    <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
      {label}
      {requiredMark && !(controlled ? value : defaultValue ?? "").trim() ? (
        <span className="text-red-700"> *</span>
      ) : null}
      <input
        key={controlled ? name : `${name}-${defaultValue ?? ""}`}
        name={name}
        type={type}
        required
        minLength={type === "password" ? 8 : undefined}
        autoComplete={autoComplete}
        value={controlled ? value : undefined}
        defaultValue={controlled ? undefined : defaultValue}
        onChange={controlled ? (event) => onChange(event.target.value) : undefined}
        onBlur={onBlur}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-navy-soft"
      />
    </label>
  );
}
