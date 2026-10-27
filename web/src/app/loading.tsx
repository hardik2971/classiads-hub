import { Container } from "@/components/ui/misc";
import { Spinner } from "@/components/ui/button";

// Root-level loading UI — shown during route segment navigation/streaming.
export default function Loading() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <Spinner className="h-8 w-8 text-brand" />
      <p className="mt-4 text-sm text-muted">Loading…</p>
    </Container>
  );
}
