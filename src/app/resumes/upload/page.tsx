import { Uploader } from "@/components/resume/uploader";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">Upload your resume</h1>
      <p className="mt-1 text-muted">We&apos;ll read it, pull out your details, and ask you to check them. The file itself isn&apos;t stored.</p>
      <Uploader />
    </div>
  );
}
