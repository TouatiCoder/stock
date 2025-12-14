import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <nav className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BuildStock Pro</h1>
        <div className="space-x-4">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-white hover:bg-slate-800">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="space-y-12 text-center">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold leading-tight">Professional Construction Management</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              BuildStock Pro is a comprehensive solution for managing construction projects, inventory, costs, and team
              collaboration. Designed for the modern construction industry in Morocco.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Free Trial
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-slate-900 bg-transparent"
            >
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <Card className="bg-slate-800/50 border-slate-700 p-6 text-left">
              <h3 className="text-lg font-bold mb-2">Project Management</h3>
              <p className="text-slate-400">
                Manage multiple construction projects with budgets, timelines, and team assignments.
              </p>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-6 text-left">
              <h3 className="text-lg font-bold mb-2">Inventory Control</h3>
              <p className="text-slate-400">
                Track materials and equipment with real-time stock levels and reorder alerts.
              </p>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-6 text-left">
              <h3 className="text-lg font-bold mb-2">Cost Tracking</h3>
              <p className="text-slate-400">Monitor expenses and manage suppliers with detailed cost analytics.</p>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-700 mt-20 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-400">
          <p>&copy; 2025 BuildStock Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
