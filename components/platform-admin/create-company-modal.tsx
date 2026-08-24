"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePlatformTranslations } from "@/components/LocaleProvider";

interface CreateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCompanyModal({
  open,
  onOpenChange,
  onSuccess
}: CreateCompanyModalProps) {
  const t = usePlatformTranslations();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    adminName: "",
    planCode: "free",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.adminName) {
      toast.error(t("fillRequiredFields"));
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/platform/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || t("failedToCreate"));
      }

      toast.success(
        <div className="space-y-1">
          <p>{t("companyCreatedSuccess")}</p>
          <p className="text-sm text-muted-foreground">
            {t("adminCredentials")
              .replace("{email}", result.data.adminEmail)
              .replace("{password}", result.data.tempPassword)}
          </p>
        </div>,
        { duration: 10000 }
      );

      // Reset form
      setFormData({ name: "", email: "", adminName: "", planCode: "free" });
      onSuccess?.();
      onOpenChange(false);

    } catch (error: any) {
      toast.error(error.message || t("failedToCreate"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("createCompany")}</DialogTitle>
            <DialogDescription>
              {t("createCompanyDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("companyNameLabel")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("companyNamePlaceholder")}
                disabled={loading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">{t("adminEmailLabel")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t("adminEmailPlaceholder")}
                disabled={loading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="adminName">{t("adminFullNameLabel")}</Label>
              <Input
                id="adminName"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder={t("adminFullNamePlaceholder")}
                disabled={loading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="plan">{t("subscriptionPlanLabel")}</Label>
              <Select
                value={formData.planCode}
                onValueChange={(value) => setFormData({ ...formData, planCode: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectPlan")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">{t("planFree")}</SelectItem>
                  <SelectItem value="pro">{t("planPro")}</SelectItem>
                  <SelectItem value="enterprise">{t("planEnterprise")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("creating") : t("createCompanyButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
