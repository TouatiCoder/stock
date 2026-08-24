import { PublicLayout } from "../layout-public";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {children}
      </div>
    </PublicLayout>
  );
}
