import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              <span className="font-semibold text-gray-900">StreetEasy Monitor</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
              Auto-contact listings{" "}
              <span className="text-indigo-600">before anyone else.</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Forward your StreetEasy alerts. We&apos;ll contact landlords and brokers
              automatically so you never miss a great apartment.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-indigo-200"
              >
                Start Free →
              </Link>
              <Link
                href="#how-it-works"
                className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-colors border border-gray-200"
              >
                How It Works
              </Link>
            </div>
          </div>

          {/* How It Works */}
          <section id="how-it-works" className="mt-32">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
              Three simple steps
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                  📬
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  1. Forward Your Alerts
                </h3>
                <p className="text-gray-600">
                  Set up email forwarding from StreetEasy to your unique inbox.
                  Takes 2 minutes.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                  ⚡
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  2. We Extract Listings
                </h3>
                <p className="text-gray-600">
                  Our system parses every listing: price, location, broker info.
                  Instant and automatic.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                  ✉️
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  3. Auto-Contact
                </h3>
                <p className="text-gray-600">
                  Choose: review contacts first or send automatically. Be first
                  in line for every listing.
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="mt-32">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
              Why apartment hunters love us
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🚀", title: "Be First", desc: "Contact listings within minutes of posting" },
                { icon: "📝", title: "Custom Templates", desc: "Personalized messages that get responses" },
                { icon: "📊", title: "Track Everything", desc: "See who replied, schedule viewings" },
                { icon: "🔒", title: "Your Control", desc: "Review mode or full auto—you decide" },
              ].map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2026 StreetEasy Monitor. Not affiliated with StreetEasy.
        </div>
      </footer>
    </div>
  );
}
