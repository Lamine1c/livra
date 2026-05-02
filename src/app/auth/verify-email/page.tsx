import { Package, Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-7 w-7 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-900">LIVRA</span>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Vérifiez votre email
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Un lien de confirmation a été envoyé à votre adresse email. Cliquez sur le lien pour activer votre compte.
          </p>
          <Link
            href="/auth/login"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
