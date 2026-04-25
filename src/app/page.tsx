import Link from "next/link";
import { Package, ShoppingCart, Users, BarChart3, ArrowRight } from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Gestion des commandes",
    description:
      "Suivez toutes vos commandes en temps réel, de la confirmation à la livraison.",
  },
  {
    icon: Users,
    title: "Base clients",
    description:
      "Centralisez vos clients avec leurs adresses et wilayas pour des livraisons rapides.",
  },
  {
    icon: BarChart3,
    title: "Statistiques",
    description:
      "Analysez vos performances : chiffre d'affaires, taux de livraison, retours.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
          <span className="text-lg sm:text-xl font-bold text-gray-900">LIVRA</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 hidden xs:block sm:block"
          >
            Connexion
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-emerald-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 whitespace-nowrap"
          >
            <span className="sm:hidden">S'inscrire</span>
            <span className="hidden sm:inline">Commencer gratuitement</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16 md:py-24 text-center">
        <span className="inline-block rounded-full bg-emerald-100 px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium text-emerald-700">
          SaaS pour e-commerçants algériens
        </span>
        <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-gray-900">
          Gérez vos commandes
          <br className="hidden sm:block" />
          {" "}
          <span className="text-emerald-600">sans friction</span>
        </h1>
        <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-gray-600 px-2">
          LIVRA centralise la gestion de vos commandes, clients et livraisons.
          Conçu pour les e-commerçants algériens, avec les 58 wilayas intégrées.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-emerald-700"
          >
            Démarrer maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            Se connecter
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm"
            >
              <div className="mb-3 sm:mb-4 inline-block rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 text-sm sm:text-base">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-8 sm:mt-16 border-t border-gray-200 py-6 sm:py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} LIVRA. Tous droits réservés.
      </footer>
    </main>
  );
}
