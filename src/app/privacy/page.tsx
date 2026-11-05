export const metadata = { title: "Privacy · Career Studio" };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 text-ink [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-2 [&_p]:text-muted [&_li]:text-muted">
      <h1 className="text-2xl font-bold">Privacy notice</h1>
      <p className="mt-2 rounded-lg bg-warn-soft px-4 py-2 text-sm !text-warn">
        Draft for the pilot. This notice will be reviewed by counsel before public launch.
      </p>
      <h2>What we store</h2>
      <p>Your account email and name, the resume details you type or upload, and a log of key actions (such as creating, approving and exporting a resume).</p>
      <h2>Uploaded files</h2>
      <p>When you upload a resume, we read the text to pre-fill your draft and then discard the file. We don&apos;t keep the original file.</p>
      <h2>Who can see your resume</h2>
      <p>Only you. Resumes are private to your account and protected by access rules in our database. We never share your resume with employers or anyone else without your explicit permission.</p>
      <h2>Your controls</h2>
      <ul className="mt-2 list-disc pl-5">
        <li>Download all of your data as a file from your Account page.</li>
        <li>Delete any resume, or delete your whole account and all its data.</li>
      </ul>
      <h2>Honesty</h2>
      <p>Career Studio never invents employers, dates, degrees, skills or numbers. Suggestions are only suggestions, and you approve every fact before export.</p>
    </article>
  );
}
