"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { BarChart3, Package, Calculator, DollarSign, Users, Zap, CheckCircle, ArrowRight } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirection automatique si connecté
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const features = [
    {
      icon: Package,
      title: "Gestion de Stock",
      description: "Suivi complet de vos inventaires avec alertes en temps réel et prévisions intelligentes.",
    },
    {
      icon: Calculator,
      title: "Calculs Structurels",
      description: "Outils de calcul de charges et bibliothèques de matériaux standardisés pour vos projets.",
    },
    {
      icon: DollarSign,
      title: "Gestion Financière",
      description: "Suivi des coûts, budgets et rentabilité des projets avec rapports détaillés.",
    },
    {
      icon: Users,
      title: "Gestion d'Équipe",
      description: "Système de rôles flexible pour administrateurs, chefs de chantier et ingénieurs.",
    },
    {
      icon: BarChart3,
      title: "Tableaux de Bord",
      description: "Dashboards personnalisés selon le rôle avec KPIs en temps réel.",
    },
    {
      icon: Zap,
      title: "Automatisation",
      description: "Workflows optimisés pour gagner du temps dans vos opérations quotidiennes.",
    },
  ]

  const testimonials = [
    {
      name: "Mohammed Al-Rashid",
      role: "Directeur de Projet",
      company: "BuildCorp Middle East",
      text: "BuildStock Pro a transformé notre gestion de stocks. Nous avons réduit les coûts de 25% en 3 mois.",
    },
    {
      name: "Fatima Al-Zahra",
      role: "Ingénieure Structure",
      company: "Desert Construction",
      text: "Les outils de calcul sont excellents. La bibliothèque de matériaux nous fait gagner beaucoup de temps.",
    },
    {
      name: "Ahmed Hassan",
      role: "Chef de Chantier",
      company: "Gulf Projects",
      text: "Interface intuitive et support excellent. Fortement recommandé pour les entreprises de construction.",
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
            <h1 className="text-2xl font-bold text-gray-900">BuildStock Pro</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline">Se connecter</Button>
            </Link>
            <Link href="/signup">
              <Button>S'inscrire</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
                Gérez vos stocks et calculs structurels
              </h2>
              <p className="text-xl text-gray-600">
                BuildStock Pro est la solution complète pour les entrepreneurs et gestionnaires opérationnels du secteur
                de la construction. Simplifiez votre gestion avec un seul outil.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button className="px-8 py-3 text-lg">Commencer gratuitement</Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="px-8 py-3 text-lg flex items-center gap-2 bg-transparent">
                  En savoir plus <ArrowRight size={20} />
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8">
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={18} className="text-green-600" />
                <span>Sécurisé et certifié</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={18} className="text-green-600" />
                <span>Support 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={18} className="text-green-600" />
                <span>Déploiement en 24h</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">Fonctionnalités Principales</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tous les outils nécessaires pour optimiser votre gestion d'entreprise
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
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">Avantages Clés</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Transformez votre façon de travailler</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              {
                title: "Réduction des Coûts",
                description: "Diminuez vos dépenses de 20-30% grâce à une meilleure gestion des stocks et budgets.",
                stat: "25%",
              },
              {
                title: "Gain de Temps",
                description: "Automatisez les tâches répétitives et libérez votre équipe pour le travail stratégique.",
                stat: "40h",
              },
              {
                title: "Meilleure Collaboration",
                description: "Facilitez la communication entre administrateurs, chefs de chantier et ingénieurs.",
                stat: "100%",
              },
              {
                title: "Décisions Éclairées",
                description: "Accédez à des tableaux de bord en temps réel pour des décisions basées sur les données.",
                stat: "Real-time",
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
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">Avis de nos Clients</h3>
            <p className="text-xl text-gray-600">Ce que pensent les professionnels de BuildStock Pro</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-yellow-400">
                      ★
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
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Prêt à transformer votre gestion ?</h3>
          <p className="text-xl text-blue-100 mb-8">Rejoignez les entreprises qui font confiance à BuildStock Pro</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button className="px-8 py-3 text-lg bg-white text-blue-600 hover:bg-gray-100">
                Commencer maintenant
              </Button>
            </Link>
            <Button
              variant="outline"
              className="px-8 py-3 text-lg text-white border-white hover:bg-blue-700 bg-transparent"
            >
              Demander une démo
            </Button>
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
                <h4 className="font-bold text-white">BuildStock Pro</h4>
              </div>
              <p className="text-sm">La solution complète pour la gestion de stocks et calculs structurels.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-blue-400 transition-colors">
                    Fonctionnalités
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Tarification
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Sécurité
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Conditions
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">© 2025 BuildStock Pro. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
