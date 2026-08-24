"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  FolderOpen,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  X,
  Zap,
  Mail,
  MapPin,
  Phone,
  Hash,
  Rocket,
  ArrowRight,
  SkipForward,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepMeta {
  label: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

interface InviteEntry {
  email: string;
  role: string;
}

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS: StepMeta[] = [
  {
    label: "Company",
    icon: <Building2 size={16} />,
    title: "Set up your company",
    subtitle: "Tell us about your organisation so we can personalise your workspace.",
  },
  {
    label: "Team",
    icon: <Users size={16} />,
    title: "Invite your team",
    subtitle: "Add colleagues — you can always do this later from Settings.",
  },
  {
    label: "Project",
    icon: <FolderOpen size={16} />,
    title: "Create your first project",
    subtitle: "Projects are the core of BuildStock Pro. Create one to get started.",
  },
  {
    label: "Done",
    icon: <CheckCircle size={16} />,
    title: "You're all set!",
    subtitle: "Your workspace is ready. Let's go to your dashboard.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div
            className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
              i < step
                ? "bg-blue-600 text-white"
                : i === step
                ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < step ? <CheckCircle size={13} /> : i + 1}
          </div>
          <span
            className={`hidden sm:block text-xs sm:text-sm ${
              i === step ? "font-medium text-gray-900" : "text-gray-400"
            }`}
          >
            {STEPS[i].label}
          </span>
          {i < total - 1 && (
            <div
              className={`h-0.5 w-4 sm:w-8 rounded-full transition-all ${
                i < step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FieldRow({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all ${
          icon ? "pl-9" : "pl-4"
        }`}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Company
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companySiret, setCompanySiret] = useState("");
  const [companyErrors, setCompanyErrors] = useState<Record<string, string>>({});

  // Step 2: Invites
  const [invites, setInvites] = useState<InviteEntry[]>([{ email: "", role: "site_manager" }]);
  const [inviteErrors, setInviteErrors] = useState<string[]>([]);
  const [inviteResults, setInviteResults] = useState<Array<{ email: string; ok: boolean }>>([]);

  // Step 3: Project
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectErrors, setProjectErrors] = useState<Record<string, string>>({});
  const [projectCreated, setProjectCreated] = useState(false);

  // ── Step 1: Company ───────────────────────────────────────────────────────

  const validateCompany = () => {
    const e: Record<string, string> = {};
    if (!companyName.trim()) e.name = "Company name is required";
    setCompanyErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitCompany = async () => {
    if (!validateCompany()) return;
    setSaving(true);
    try {
      // Fetch current user to get companyId
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      const meJson = meRes.ok ? await meRes.json() : {};
      const companyId = meJson.user?.companyId;
      if (!companyId) throw new Error("No company found");

      const res = await fetch(`/api/company/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: companyName,
          phone: companyPhone || undefined,
          address: companyAddress || undefined,
          siret: companySiret || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to update company");
      }
      setStep(1);
    } catch (err: any) {
      setCompanyErrors({ submit: err?.message || "Failed to save company details." });
    } finally {
      setSaving(false);
    }
  };

  // ── Step 2: Invites ───────────────────────────────────────────────────────

  const addInvite = () =>
    setInvites((prev) => [...prev, { email: "", role: "site_manager" }]);

  const removeInvite = (i: number) =>
    setInvites((prev) => prev.filter((_, idx) => idx !== i));

  const updateInvite = (i: number, field: keyof InviteEntry, value: string) =>
    setInvites((prev) =>
      prev.map((inv, idx) => (idx === i ? { ...inv, [field]: value } : inv))
    );

  const submitInvites = async () => {
    const valid = invites.filter((inv) => inv.email.trim());
    if (valid.length === 0) {
      setStep(2);
      return;
    }

    const errors: string[] = invites.map((inv) => {
      if (!inv.email.trim()) return "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email)) return "Invalid email";
      return "";
    });

    if (errors.some((e) => e)) {
      setInviteErrors(errors);
      return;
    }

    setSaving(true);
    const results: Array<{ email: string; ok: boolean }> = [];
    for (const inv of valid) {
      try {
        const res = await fetch("/api/send-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: inv.email, role: inv.role }),
        });
        results.push({ email: inv.email, ok: res.ok });
      } catch {
        results.push({ email: inv.email, ok: false });
      }
    }
    setInviteResults(results);
    setSaving(false);
    setStep(2);
  };

  // ── Step 3: Project ───────────────────────────────────────────────────────

  const validateProject = () => {
    const e: Record<string, string> = {};
    if (!projectName.trim()) e.name = "Project name is required";
    setProjectErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitProject = async () => {
    if (!validateProject()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: projectName,
          location: projectLocation || undefined,
          description: projectDescription || undefined,
          status: "planning",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create project");
      }
      setProjectCreated(true);
      setStep(3);
    } catch (err: any) {
      setProjectErrors({ submit: err?.message || "Failed to create project." });
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <nav className="flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur px-6">
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <Building2 size={18} className="text-blue-600" />
          BuildStock Pro
        </div>
        <span className="text-xs text-gray-400">Setup wizard</span>
      </nav>

      {/* Main content */}
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        {/* Progress */}
        <div className="mb-10">
          <ProgressBar step={step} total={STEPS.length} />
        </div>

        {/* Step card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">{STEPS[step].icon}</span>
              <h2 className="text-xl font-bold text-gray-900">{STEPS[step].title}</h2>
            </div>
            <p className="text-sm text-gray-500">{STEPS[step].subtitle}</p>
          </div>

          {/* ── Step 1: Company ─────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <FieldRow label="Company name *" error={companyErrors.name}>
                <Input
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="e.g. Al-Rashid Construction"
                  icon={<Building2 size={14} />}
                />
              </FieldRow>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Phone number">
                  <Input
                    value={companyPhone}
                    onChange={setCompanyPhone}
                    placeholder="+1 555 000 0000"
                    type="tel"
                    icon={<Phone size={14} />}
                  />
                </FieldRow>
                <FieldRow label="SIRET / Company ID">
                  <Input
                    value={companySiret}
                    onChange={setCompanySiret}
                    placeholder="123 456 789"
                    icon={<Hash size={14} />}
                  />
                </FieldRow>
              </div>

              <FieldRow label="Business address">
                <Input
                  value={companyAddress}
                  onChange={setCompanyAddress}
                  placeholder="123 Main Street, City, Country"
                  icon={<MapPin size={14} />}
                />
              </FieldRow>

              {companyErrors.submit && (
                <p className="text-sm text-red-600">{companyErrors.submit}</p>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={submitCompany}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  Save & continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Invite team ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              {inviteResults.length > 0 && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm space-y-1">
                  {inviteResults.map((r) => (
                    <p key={r.email} className={r.ok ? "text-green-700" : "text-red-600"}>
                      {r.ok ? "✓" : "✗"} {r.email}
                    </p>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {invites.map((inv, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <div className="sm:col-span-3">
                        <Input
                          value={inv.email}
                          onChange={(v) => updateInvite(i, "email", v)}
                          placeholder="colleague@company.com"
                          type="email"
                          icon={<Mail size={14} />}
                        />
                        {inviteErrors[i] && (
                          <p className="mt-1 text-xs text-red-600">{inviteErrors[i]}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={inv.role}
                          onChange={(e) => updateInvite(i, "role", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="site_manager">Site Manager</option>
                          <option value="structural_engineer">Engineer</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                    </div>
                    {invites.length > 1 && (
                      <button
                        onClick={() => removeInvite(i)}
                        className="mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {invites.length < 5 && (
                <button
                  onClick={addInvite}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={14} />
                  Add another
                </button>
              )}

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  <SkipForward size={14} />
                  Skip for now
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    onClick={submitInvites}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Mail size={14} />
                    )}
                    Send invites
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: First project ────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <FieldRow label="Project name *" error={projectErrors.name}>
                <Input
                  value={projectName}
                  onChange={setProjectName}
                  placeholder="e.g. Downtown Office Tower"
                  icon={<FolderOpen size={14} />}
                />
              </FieldRow>

              <FieldRow label="Location">
                <Input
                  value={projectLocation}
                  onChange={setProjectLocation}
                  placeholder="City, Country"
                  icon={<MapPin size={14} />}
                />
              </FieldRow>

              <FieldRow label="Description">
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of the project..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none transition-all"
                />
              </FieldRow>

              {projectErrors.submit && (
                <p className="text-sm text-red-600">{projectErrors.submit}</p>
              )}

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  <SkipForward size={14} />
                  Skip for now
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    onClick={submitProject}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <FolderOpen size={14} />
                    )}
                    Create project
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Done ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="text-center py-4 space-y-6">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <Rocket size={36} className="text-green-600" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Your workspace is ready!
                </h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                  You've completed the setup. Start managing your construction
                  operations with BuildStock Pro.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                {[
                  {
                    icon: <Building2 size={16} className="text-blue-600" />,
                    label: "Company configured",
                    done: true,
                  },
                  {
                    icon: <Users size={16} className="text-blue-600" />,
                    label: inviteResults.length > 0
                      ? `${inviteResults.filter((r) => r.ok).length} invite${inviteResults.filter((r) => r.ok).length !== 1 ? "s" : ""} sent`
                      : "Team invites skipped",
                    done: true,
                  },
                  {
                    icon: <FolderOpen size={16} className="text-blue-600" />,
                    label: projectCreated
                      ? `"${projectName}" created`
                      : "First project skipped",
                    done: true,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    {item.icon}
                    <span className="text-xs text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col xs:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <Zap size={15} />
                  Go to dashboard
                  <ArrowRight size={14} />
                </button>
                {!projectCreated && (
                  <button
                    onClick={() => router.push("/projects/new")}
                    className="flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FolderOpen size={14} />
                    Create a project
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Skip all */}
        {step < 3 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
            >
              Skip setup and go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
