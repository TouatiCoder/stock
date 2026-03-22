"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/mysql/auth-context";

export function TrialSubscriptionPopup() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const dismissKey = useMemo(() => {
    if (!user?.id) return null;
    return `trial-popup-dismissed:${user.id}:${user.subscriptionTrialEndsAt || "none"}`;
  }, [user?.id, user?.subscriptionTrialEndsAt]);

  useEffect(() => {
    if (!user || user.subscriptionStatus !== "trialing" || !dismissKey) return;

    const dismissed = sessionStorage.getItem(dismissKey);
    if (dismissed === "1") return;

    setOpen(true);
  }, [user, dismissKey]);

  const handleClose = () => {
    if (dismissKey) sessionStorage.setItem(dismissKey, "1");
    setOpen(false);
  };

  const handleSubscribe = () => {
    if (dismissKey) sessionStorage.setItem(dismissKey, "1");
    setOpen(false);
    router.push("/billing");
  };

  if (!user || user.subscriptionStatus !== "trialing") return null;

  const trialEndsText = user.subscriptionTrialEndsAt
    ? new Date(user.subscriptionTrialEndsAt).toLocaleDateString()
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trial period active</DialogTitle>
          <DialogDescription>
            {trialEndsText
              ? `Your account is currently in trial mode until ${trialEndsText}. Subscribe now to keep full access.`
              : "Your account is currently in trial mode. Subscribe now to keep full access."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Later
          </Button>
          <Button onClick={handleSubscribe}>Subscribe now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

