import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import UpgradePage from "./UpgradePage";
 
 

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <UpgradePage/>
    </Suspense>
  );
}