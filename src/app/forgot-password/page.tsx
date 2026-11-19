import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/password-forms";
import { Card } from "@/components/ui";

export const metadata = { title: "Reset your password · Career Studio" };

export default function Page() {
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-[30px] font-semibold text-ink sm:text-[36px]">Reset your password</h1>
      <p className="mb-6 mt-1 text-muted">Enter your email and we&apos;ll send you a link to choose a new password.</p>
      <Card>
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </Card>
    </div>
  );
}
