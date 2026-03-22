"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function PaymentBillingSettings() {
  const [paymentMethod, setPaymentMethod] = useState("stripe")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchPaymentMethod = async () => {
      try {
        setIsLoading(true)
        const res = await fetch("/api/company/subscription-payment-method")
        const data = await res.json()
        if (res.ok && typeof data?.payment_method === "string") {
          setPaymentMethod(data.payment_method)
        }
      } catch (error) {
        console.error("Failed to fetch payment method", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentMethod()
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const res = await fetch("/api/company/subscription-payment-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: paymentMethod }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to update payment method")
      toast.success("Payment method updated")
    } catch (error: any) {
      toast.error(error?.message || "Failed to update payment method")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiement & Billing</CardTitle>
        <CardDescription>Choisissez la methode de paiement par defaut pour l'abonnement.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="space-y-2 max-w-md">
              <Label htmlFor="subscriptionPaymentMethod">Payment method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="subscriptionPaymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save payment method
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

