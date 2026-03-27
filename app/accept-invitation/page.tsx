export const dynamic = 'force-dynamic'
import { Suspense } from "react";
 
import { Loader2 } from "lucide-react";
import AcceptInvitationPage from "./AcceptInvitationPage";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    }>
      <AcceptInvitationPage />
    </Suspense>
  );
}
