import { isEphemeralDemoDeployment } from "@/lib/runtime-storage";

export function DemoEnvironmentBanner() {
  if (!isEphemeralDemoDeployment(process.env)) {
    return null;
  }

  return (
    <div className="border-b border-amber-300/30 bg-amber-100 px-4 py-3 text-center text-sm text-stone-900">
      Demo environment: progress may reset occasionally.
    </div>
  );
}
