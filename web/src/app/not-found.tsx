import { Container } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-4 text-3xl font-extrabold">Page not found</h1>
      <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/search" variant="outline">Browse listings</ButtonLink>
      </div>
    </Container>
  );
}
