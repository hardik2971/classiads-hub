"use client";

import { useRef, useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { useApi } from "@/lib/use-api";
import { Badge } from "@/components/ui/misc";
import { Button, Spinner } from "@/components/ui/button";
import { Field, inputClass } from "@/components/auth/auth-shell";

interface Status {
  is_verified: boolean;
  request?: { status: string; rejection_reason?: string | null } | null;
}

export default function VerificationPage() {
  const { data, loading, reload } = useApi<Status>("/verification");
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      await clientApi("/verification", { method: "POST", formData: fd });
      setOk(true);
      reload();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner className="h-7 w-7 text-brand" />;

  const verified = data?.is_verified;
  const pending = data?.request?.status === "pending";

  return (
    <div className="max-w-lg">
      <h1 className="mb-5 text-2xl font-bold">Verification</h1>

      {verified ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-700">
          <p className="text-lg font-bold">✔️ Your account is verified</p>
          <p className="mt-1 text-sm">You have the verified badge on your profile.</p>
        </div>
      ) : pending ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-700">
          <Badge color="accent">Pending review</Badge>
          <p className="mt-2 text-sm">Your documents are under review. We&apos;ll notify you shortly.</p>
        </div>
      ) : (
        <form ref={formRef} onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          {data?.request?.status === "rejected" && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Previous request rejected: {data.request.rejection_reason}
            </div>
          )}
          {ok && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Submitted for review.</div>}
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <Field label="Document type">
            <select name="document_type" className={inputClass} required>
              <option value="id_card">ID Card</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
            </select>
          </Field>
          <Field label="Document number (optional)">
            <input name="document_number" className={inputClass} />
          </Field>
          <Field label="Front image">
            <input name="front_image" type="file" accept="image/*" required className="text-sm" />
          </Field>
          <Field label="Back image (optional)">
            <input name="back_image" type="file" accept="image/*" className="text-sm" />
          </Field>
          <Field label="Selfie (optional)">
            <input name="selfie_image" type="file" accept="image/*" className="text-sm" />
          </Field>
          <Button type="submit" loading={submitting}>Submit for verification</Button>
        </form>
      )}
    </div>
  );
}
