"use client";

import { useEffect } from "react";

import { Container } from "@/components/ui/misc";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production, report to Sentry/etc. here.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl">⚠️</div>
      <h1 className="mt-4 text-3xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted">
        An unexpected error occurred. You can try again or head back home.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">Go home</ButtonLink>
      </div>
    </Container>
  );
}
