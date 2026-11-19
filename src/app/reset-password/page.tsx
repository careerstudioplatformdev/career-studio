import { ResetPasswordForm } from "@/components/password-forms";
import { Card } from "@/components/ui";

export const metadata = { title: "Choose a new password · Career Studio" };

export default function Page() {
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-[30px] font-semibold text-ink sm:text-[36px]">Choose a new password</h1>
      <p className="mb-6 mt-1 text-muted">Use at least 8 characters.</p>
      <Card>
        <ResetPasswordForm />
      </Card>
    </div>
  );
}
