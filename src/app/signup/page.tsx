import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { Card } from "@/components/ui";

export default function Page() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-[30px] font-semibold text-ink sm:text-[36px]">Create your account</h1>
      <p className="mb-6 mt-1 text-muted">Free to start. Your resume stays private.</p>
      <Card>
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
      </Card>
    </div>
  );
}
