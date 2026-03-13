"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type ReportActionButtonProps = {
  className: string;
  idleLabel: string;
  pendingLabel: string;
  formAction?: ComponentProps<"button">["formAction"];
};

export function ReportActionButton({
  className,
  idleLabel,
  pendingLabel,
  formAction,
}: ReportActionButtonProps) {
  const { pending } = useFormStatus();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!pending) {
      setSubmitted(false);
    }
  }, [pending]);

  const label = pending && submitted ? pendingLabel : idleLabel;

  return (
    <button
      className={className}
      disabled={pending}
      formAction={formAction}
      onClick={() => setSubmitted(true)}
      type="submit"
    >
      {label}
    </button>
  );
}
