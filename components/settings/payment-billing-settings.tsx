"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Crown, CheckCircle, Clock, AlertTriangle, Zap, CreditCard, ExternalLink, Banknote } from "lucide-react"
import { toast } from "sonner"
import { useBillingTranslations, useLocale } from "@/components/LocaleProvider"
import { computeCadencePrice, type BillingCadence } from "@/lib/subscription/pricing"

interface PlanFeature {
  featureCode: string
  limitValue: number | null
  enabled: boolean
}

interface Plan {
  code: string
  name: string
  price: number
  features: PlanFeature[]
  isCurrent: boolean
}

interface SubscriptionInfo {
  id: string
  status: string
  planCode: string
  planName: string
  price: number
  isTrialing: boolean
  trialDaysLeft: number | null
  trialExpired: boolean
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  features: {
    maxProjects: number | null
    maxUsers: number | null
    advancedAnalytics: boolean
  }
}

interface PaymentRecord {
  planCode: string
  cadence: string
  amountMad: number
  method: string
  paidAt?: string | null
  createdAt?: string
}

type PaymentMethods = { stripe: boolean; paypal: boolean; cash: boolean }

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  pro: "bg-blue-100 text-blue-700",
  enterprise: "bg-purple-100 text-purple-700",
}

export function PaymentBillingSettings() {
  const t = useBillingTranslations()
  const { locale } = useLocale()
  const [paymentMethod, setPaymentMethod] = useState("stripe")
  const [isLoadingPayment, setIsLoadingPayment] = useState(true)
  const [isSavingPayment, setIsSavingPayment] = useState(false)

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [lastPayment, setLastPayment] = useState<PaymentRecord | null>(null)
  const [pendingPayment, setPendingPayment] = useState<PaymentRecord | null>(null)
  const [isLoadingSub, setIsLoadingSub] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null)

  const [availableMethods, setAvailableMethods] = useState<PaymentMethods>({ stripe: false, paypal: false, cash: false })
  const [methodPickerTarget, setMethodPickerTarget] = useState<{ planCode: string; cadence: BillingCadence } | null>(null)
  const [isChoosingMethod, setIsChoosingMethod] = useState<string | null>(null)

  const PLAN_DESCRIPTIONS: Record<string, string> = {
    free: t("planDescFree"),
    pro: t("planDescPro"),
    enterprise: t("planDescEnterprise"),
  }

  const METHOD_LABELS: Record<string, string> = {
    stripe: t("stripe"),
    paypal: t("paypal"),
    cash: t("cash"),
  }

  useEffect(() => {
    fetchPaymentMethod()
    fetchSubscription()
    fetchAvailableMethods()

    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get("payment")
    if (paymentStatus === "success") {
      toast.success(t("paymentSuccessToast"))
      window.history.replaceState({}, "", window.location.pathname)
    } else if (paymentStatus === "cancelled") {
      toast.error(t("paymentCancelledToast"))
      window.history.replaceState({}, "", window.location.pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAvailableMethods = async () => {
    try {
      const res = await fetch("/api/billing/payment-methods")
      const data = await res.json()
      if (res.ok) {
        setAvailableMethods({ stripe: !!data.stripe, paypal: !!data.paypal, cash: !!data.cash })
      }
    } catch (error) {
      console.error("Failed to fetch payment methods", error)
    }
  }

  const fetchPaymentMethod = async () => {
    try {
      setIsLoadingPayment(true)
      const res = await fetch("/api/company/subscription-payment-method")
      const data = await res.json()
      if (res.ok && typeof data?.payment_method === "string") {
        setPaymentMethod(data.payment_method)
      }
    } catch (error) {
      console.error("Failed to fetch payment method", error)
    } finally {
      setIsLoadingPayment(false)
    }
  }

  const fetchSubscription = async () => {
    try {
      setIsLoadingSub(true)
      const res = await fetch("/api/subscription")
      const data = await res.json()
      if (res.ok) {
        setSubscription(data.subscription)
        setPlans(data.plans || [])
        setLastPayment(data.lastPayment || null)
        setPendingPayment(data.pendingPayment || null)
      }
    } catch (error) {
      console.error("Failed to fetch subscription", error)
    } finally {
      setIsLoadingSub(false)
    }
  }

  const handleSavePayment = async () => {
    try {
      setIsSavingPayment(true)
      const res = await fetch("/api/company/subscription-payment-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: paymentMethod }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || t("genericError"))
      toast.success(t("paymentUpdated"))
    } catch (error: any) {
      toast.error(error?.message || t("paymentUpdateError"))
    } finally {
      setIsSavingPayment(false)
    }
  }

  const handleFreePlanSwitch = async (planCode: string) => {
    if (isUpgrading) return
    const key = `${planCode}:monthly`
    try {
      setIsUpgrading(key)
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || t("genericError"))
      toast.success(t("planUpdated").replace("{name}", data.planName))
      await fetchSubscription()
    } catch (error: any) {
      toast.error(error?.message || t("planUpdateError"))
    } finally {
      setIsUpgrading(null)
    }
  }

  const chooseMethod = async (method: "stripe" | "paypal" | "cash") => {
    if (!methodPickerTarget || isChoosingMethod) return
    const { planCode, cadence } = methodPickerTarget
    try {
      setIsChoosingMethod(method)
      if (method === "stripe") {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_code: planCode, cadence }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || t("genericError"))
        if (data.checkout_url) {
          window.location.href = data.checkout_url
          return
        }
        throw new Error(t("genericError"))
      }

      const res = await fetch("/api/billing/manual-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode, cadence, method }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || t("genericError"))
      toast.success(t("manualPaymentRequested"))
      setMethodPickerTarget(null)
      await fetchSubscription()
    } catch (error: any) {
      toast.error(error?.message || t("genericError"))
    } finally {
      setIsChoosingMethod(null)
    }
  }

  const featureLabel = (code: string, limitValue: number | null, enabled: boolean): string => {
    if (code === "max_projects") {
      return limitValue === null ? t("unlimitedProjects") : t("maxProjects").replace("{count}", String(limitValue))
    }
    if (code === "max_users") {
      return limitValue === null ? t("unlimitedUsers") : t("maxUsers").replace("{count}", String(limitValue))
    }
    if (code === "advanced_analytics") {
      return enabled ? t("advancedAnalytics") : t("basicAnalytics")
    }
    return code
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "trialing": return t("statusTrialing")
      case "active": return t("statusActive")
      case "free": return t("statusFree")
      case "cancelled": return t("statusCancelled")
      case "past_due": return t("statusPastDue")
      default: return status
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "trialing": return "bg-amber-100 text-amber-700"
      case "active": return "bg-green-100 text-green-700"
      case "free": return "bg-gray-100 text-gray-600"
      case "cancelled": return "bg-red-100 text-red-700"
      case "past_due": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const cadenceLabel = (cadence: string) => {
    switch (cadence) {
      case "monthly": return t("billingMonthly")
      case "quarterly": return t("billingQuarterly")
      case "annual": return t("billingAnnual")
      default: return cadence
    }
  }

  const formatDate = (dateStr: string) => {
    const dateLocale = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US"
    return new Date(dateStr).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            {t("currentSubscription")}
          </CardTitle>
          <CardDescription>{t("currentSubscriptionDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSub ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </div>
          ) : subscription ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">{subscription.planName}</span>
                <Badge className={statusColor(subscription.status)}>
                  {statusLabel(subscription.status)}
                </Badge>
                {subscription.price > 0 && (
                  <span className="text-sm text-gray-500">{subscription.price} {t("madPerMonth")}</span>
                )}
              </div>

              {lastPayment && (
                <p className="text-sm text-gray-600">
                  {t("paidOnVia")
                    .replace("{date}", lastPayment.paidAt ? formatDate(lastPayment.paidAt) : "—")
                    .replace("{method}", METHOD_LABELS[lastPayment.method] || lastPayment.method)}
                </p>
              )}

              {pendingPayment && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-sm font-medium text-amber-700">
                    {t("pendingPaymentBanner")
                      .replace("{plan}", pendingPayment.planCode)
                      .replace("{cadence}", cadenceLabel(pendingPayment.cadence))
                      .replace("{method}", METHOD_LABELS[pendingPayment.method] || pendingPayment.method)}
                  </p>
                </div>
              )}

              {/* Trial Countdown */}
              {subscription.isTrialing && subscription.trialDaysLeft !== null && (
                <div className={`flex items-center gap-3 rounded-lg p-4 ${subscription.trialDaysLeft <= 2 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
                  {subscription.trialDaysLeft <= 2 ? (
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <p className={`font-medium ${subscription.trialDaysLeft <= 2 ? "text-red-700" : "text-amber-700"}`}>
                      {subscription.trialDaysLeft === 0
                        ? t("trialExpiresToday")
                        : t("trialDaysRemaining").replace("{days}", String(subscription.trialDaysLeft))}
                    </p>
                    {subscription.trialEndsAt && (
                      <p className="text-sm text-gray-600">
                        {t("expiresOn").replace("{date}", formatDate(subscription.trialEndsAt))}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {subscription.trialExpired && (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <p className="font-medium text-red-700">{t("trialExpired")}</p>
                </div>
              )}

              {/* Current plan features */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  {subscription.features.maxProjects === null ? t("unlimitedProjects") : t("maxProjects").replace("{count}", String(subscription.features.maxProjects))}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  {subscription.features.maxUsers === null ? t("unlimitedUsers") : t("maxUsers").replace("{count}", String(subscription.features.maxUsers))}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className={`h-4 w-4 shrink-0 ${subscription.features.advancedAnalytics ? "text-green-600" : "text-gray-300"}`} />
                  <span className={subscription.features.advancedAnalytics ? "" : "text-gray-400"}>
                    {t("advancedAnalytics")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t("subscriptionLoadError")}</p>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison & Upgrade */}
      {plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              {t("changePlan")}
            </CardTitle>
            <CardDescription>{t("changePlanDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm font-semibold text-gray-900">{t("pricingGridTitle")}</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">{t("pricingGridPlan")}</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">{t("billingMonthly")}</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">{t("billingQuarterly")}</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">{t("billingAnnual")}</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => {
                    const isCurrent = plan.code === subscription?.planCode
                    const maxProjectsF = plan.features.find((f: PlanFeature) => f.featureCode === "max_projects")
                    const maxUsersF = plan.features.find((f: PlanFeature) => f.featureCode === "max_users")
                    const analyticsF = plan.features.find((f: PlanFeature) => f.featureCode === "advanced_analytics")

                    const quarterly = computeCadencePrice(plan.price, "quarterly")
                    const annual = computeCadencePrice(plan.price, "annual")

                    const buttonCls = isCurrent
                      ? "bg-gray-100 text-gray-500 cursor-default"
                      : plan.code === "enterprise"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-blue-600 hover:bg-blue-700"

                    const onPick = (cadence: BillingCadence) => {
                      if (isCurrent) return
                      if (plan.price === 0) {
                        void handleFreePlanSwitch(plan.code)
                        return
                      }
                      setMethodPickerTarget({ planCode: plan.code, cadence })
                    }

                    return (
                      <tr key={plan.code} className={`border-b border-gray-100 align-top ${isCurrent ? "bg-blue-50/50" : ""}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PLAN_BADGE_COLORS[plan.code] || "bg-gray-100 text-gray-600"}`}>
                              {plan.name}
                            </span>
                            {isCurrent && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">{t("currentBadge")}</Badge>
                            )}
                          </div>

                          <p className="mt-2 max-w-xs text-xs text-gray-500">{PLAN_DESCRIPTIONS[plan.code] || ""}</p>

                          <ul className="mt-2 space-y-1">
                            {maxProjectsF && (
                              <li className="flex items-center gap-2 text-xs text-gray-700">
                                <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                {featureLabel("max_projects", maxProjectsF.limitValue, maxProjectsF.enabled)}
                              </li>
                            )}
                            {maxUsersF && (
                              <li className="flex items-center gap-2 text-xs text-gray-700">
                                <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                {featureLabel("max_users", maxUsersF.limitValue, maxUsersF.enabled)}
                              </li>
                            )}
                            {analyticsF && (
                              <li className={`flex items-center gap-2 text-xs ${analyticsF.enabled ? "text-gray-700" : "text-gray-400"}`}>
                                <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${analyticsF.enabled ? "text-green-600" : "text-gray-300"}`} />
                                {t("advancedAnalytics")}
                              </li>
                            )}
                          </ul>
                        </td>

                        <td className="px-4 py-4 text-center">
                          {plan.price === 0 ? (
                            <span className="font-semibold text-gray-900">{t("free")}</span>
                          ) : (
                            <span className="font-semibold text-gray-900">
                              {plan.price} {t("madPerMonth")}
                            </span>
                          )}
                          <div className="mt-2 flex justify-center">
                            <Button
                              size="sm"
                              className={buttonCls}
                              disabled={isCurrent || isUpgrading !== null}
                              onClick={() => onPick("monthly")}
                            >
                              {isUpgrading === `${plan.code}:monthly` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isCurrent ? (
                                t("currentPlan")
                              ) : plan.price === 0 ? (
                                t("downgrade")
                              ) : (
                                t("choosePlan")
                              )}
                            </Button>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          {plan.price === 0 ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <>
                              <div className="font-semibold text-gray-900">{quarterly.totalMad} MAD</div>
                              <div className="text-xs text-gray-500">
                                ({quarterly.perMonthMad}{t("perMonthSuffix")})
                              </div>
                              <div className="mt-2 flex justify-center">
                                <Button
                                  size="sm"
                                  className={buttonCls}
                                  disabled={isCurrent || isUpgrading !== null}
                                  onClick={() => onPick("quarterly")}
                                >
                                  {isCurrent ? t("currentPlan") : t("choosePlan")}
                                </Button>
                              </div>
                            </>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                          {plan.price === 0 ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <>
                              <div className="font-semibold text-gray-900">{annual.totalMad} MAD</div>
                              <div className="text-xs text-gray-500">
                                ({annual.perMonthMad}{t("perMonthSuffix")})
                              </div>
                              <div className="mt-2 flex justify-center">
                                <Button
                                  size="sm"
                                  className={buttonCls}
                                  disabled={isCurrent || isUpgrading !== null}
                                  onClick={() => onPick("annual")}
                                >
                                  {isCurrent ? t("currentPlan") : t("choosePlan")}
                                </Button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment method picker */}
      <Dialog open={methodPickerTarget !== null} onOpenChange={(open) => !open && setMethodPickerTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("methodPickerTitle")}</DialogTitle>
            <DialogDescription>
              {methodPickerTarget && t("methodPickerDesc").replace("{cadence}", cadenceLabel(methodPickerTarget.cadence))}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { key: "stripe" as const, label: t("stripe"), icon: <CreditCard className="h-5 w-5" /> },
              { key: "paypal" as const, label: t("paypal"), icon: <ExternalLink className="h-5 w-5" /> },
              { key: "cash" as const, label: t("cash"), icon: <Banknote className="h-5 w-5" /> },
            ]
              .filter((opt) => availableMethods[opt.key])
              .map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => chooseMethod(opt.key)}
                  disabled={isChoosingMethod !== null}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-200 p-4 text-sm text-gray-700 transition-all hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
                >
                  {isChoosingMethod === opt.key ? <Loader2 className="h-5 w-5 animate-spin" /> : opt.icon}
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
          </div>
          {availableMethods.stripe === false && availableMethods.paypal === false && availableMethods.cash === false && (
            <p className="text-sm text-gray-500">{t("noMethodsAvailable")}</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>{t("paymentMethod")}</CardTitle>
          <CardDescription>{t("paymentMethodDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingPayment ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </div>
          ) : (
            <>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="subscriptionPaymentMethod">{t("paymentMethodLabel")}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="subscriptionPaymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">{t("stripe")}</SelectItem>
                    <SelectItem value="paypal">{t("paypal")}</SelectItem>
                    <SelectItem value="bank_transfer">{t("bankTransfer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSavePayment} disabled={isSavingPayment}>
                {isSavingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("save")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
