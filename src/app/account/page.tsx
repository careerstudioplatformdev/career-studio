import { AccountControls } from "@/components/account-controls";
import { Card } from "@/components/ui";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export default async function Account() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name, consent_version, consented_at").maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">Account and privacy</h1>
      <Card className="mt-6">
        <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted">Name</dt>
          <dd>{profile?.full_name || "—"}</dd>
          <dt className="text-muted">Email</dt>
          <dd>{user?.email}</dd>
          <dt className="text-muted">Consent</dt>
          <dd>
            {profile?.consented_at
              ? `Agreed to privacy notice (version ${profile.consent_version}) on ${new Date(profile.consented_at).toLocaleDateString("en-US")}`
              : "Not recorded"}
          </dd>
        </dl>
      </Card>
      <AccountControls />
    </div>
  );
}
