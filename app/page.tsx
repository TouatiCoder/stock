import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/auth-utils"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { BarChart3, Package, Calculator, DollarSign, Users, Zap, CheckCircle, ArrowRight } from "lucide-react"
import { t } from "@/lib/server-i18n"

export default async function Home() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  const registrationOpen = true

  const features = [
    {
      icon: Package,
      title: await t('common', 'inventory'),
      description: await t('home', 'inventoryDescription'),
    },
    {
      icon: Calculator,
      title: await t('home', 'structuralCalculations'),
      description: await t('home', 'calculationsDescription'),
    },
    {
      icon: DollarSign,
      title: await t('common', 'costs'),
      description: await t('home', 'financialDescription'),
    },
    {
      icon: Users,
      title: await t('home', 'teamManagement'),
      description: await t('home', 'teamDescription'),
    },
    {
      icon: BarChart3,
      title: await t('common', 'dashboard'),
      description: await t('home', 'dashboardDescription'),
    },
    {
      icon: Zap,
      title: await t('home', 'automation'),
      description: await t('home', 'automationDescription'),
    },
  ]

  const testimonials = [
    {
      name: "Mohammed Al-Rashid",
      role: await t('home', 'projectDirector'),
      company: "BuildCorp Middle East",
      text: await t('home', 'testimonial1'),
    },
    {
      name: "Fatima Al-Zahra",
      role: await t('home', 'structuralEngineer'),
      company: "Desert Construction",
      text: await t('home', 'testimonial2'),
    },
    {
      name: "Ahmed Hassan",
      role: await t('home', 'siteManager'),
      company: "Gulf Projects",
      text: await t('home', 'testimonial3'),
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">BS</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{await t('auth', 'login.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="outline">{await t('auth', 'login.submit')}</Button>
            </Link>
            {registrationOpen && (
              <Link href="/signup">
                <Button>{await t('auth', 'login.createAdmin')}</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
                {await t('home', 'heroTitle')}
              </h2>
              <p className="text-xl text-gray-600">
                {await t('home', 'heroDescription')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {registrationOpen ? (
                <Link href="/signup">
                  <Button className="px-8 py-3 text-lg">{await t('auth', 'login.createAdmin')}</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button className="px-8 py-3 text-lg">{await t('auth', 'login.submit')}</Button>
                </Link>
              )}
              <Link href="#features">
                <Button variant="outline" className="px-8 py-3 text-lg flex items-center gap-2 bg-transparent">
                  {await t('home', 'learnMore')} <ArrowRight size={20} />
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8">
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={18} className="text-green-600" />
                <span>{await t('home', 'secureCertified')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={18} className="text-green-600" />
                <span>{await t('home', 'support247')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={18} className="text-green-600" />
                <span>{await t('home', 'deployment24h')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">{await t('home', 'mainFeatures')}</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {await t('home', 'featuresDescription')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all"
                >
                  <div className="p-3 w-fit bg-blue-50 rounded-lg mb-4">
                    <Icon size={24} className="text-blue-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">{await t('home', 'keyBenefits')}</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{await t('home', 'transformWork')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              {
                title: await t('home', 'costReduction'),
                description: await t('home', 'costReductionDescription'),
                stat: "25%",
              },
              {
                title: await t('home', 'timeSaving'),
                description: await t('home', 'timeSavingDescription'),
                stat: "40h",
              },
              {
                title: await t('home', 'betterCollaboration'),
                description: await t('home', 'collaborationDescription'),
                stat: "100%",
              },
              {
                title: await t('home', 'informedDecisions'),
                description: await t('home', 'decisionsDescription'),
                stat: await t('home', 'realTime'),
              },
            ].map((benefit, i) => (
              <div key={i} className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="text-4xl font-bold text-blue-600 mb-4">{benefit.stat}</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h4>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">{await t('home', 'clientReviews')}</h3>
            <p className="text-xl text-gray-600">{await t('home', 'whatProfessionalsSay')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-yellow-400">
                      *
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-gray-500">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">{await t('home', 'readyToTransform')}</h3>
          <p className="text-xl text-blue-100 mb-8">{await t('home', 'joinCompanies')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {registrationOpen ? (
              <Link href="/signup">
                <Button className="px-8 py-3 text-lg bg-white text-blue-600 hover:bg-gray-100">
                  {await t('auth', 'login.createAdmin')}
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="px-8 py-3 text-lg bg-white text-blue-600 hover:bg-gray-100">
                  {await t('auth', 'login.submit')}
                </Button>
              </Link>
            )}

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BS</span>
                </div>
                <h4 className="font-bold text-white">{await t('auth', 'login.title')}</h4>
              </div>
              <p className="text-sm">{await t('home', 'solutionDescription')}</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">{await t('home', 'product')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-blue-400 transition-colors">
                    {await t('home', 'features')}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-blue-400 transition-colors">
                    {await t('home', 'pricing')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">{await t('home', 'company')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="text-gray-500 cursor-not-allowed">{await t('home', 'about')}</span>
                </li>
                <li>
                  <span className="text-gray-500 cursor-not-allowed">{await t('home', 'blog')}</span>
                </li>
                <li>
                  <span className="text-gray-500 cursor-not-allowed">{await t('home', 'contact')}</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">{await t('home', 'legal')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="text-gray-500 cursor-not-allowed" title="Coming soon">{await t('home', 'privacy')}</span>
                </li>
                <li>
                  <span className="text-gray-500 cursor-not-allowed" title="Coming soon">{await t('home', 'terms')}</span>
                </li>
                <li>
                  <span className="text-gray-500 cursor-not-allowed" title="Coming soon">{await t('home', 'cookies')}</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">© 2025 BuildStock Pro. {await t('home', 'allRightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

