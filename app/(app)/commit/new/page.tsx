import { TopBar } from "@/components/TopBar";
import { CreateCommitForm } from "@/components/CreateCommitForm";

export const dynamic = "force-dynamic";

export default function NewCommitPage() {
  return (
    <div>
      <TopBar variant="close" fallbackHref="/" />
      <CreateCommitForm />
    </div>
  );
}
