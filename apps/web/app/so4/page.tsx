// apps/web/app/so4/page.tsx
import Link from "next/link";
import Image from "next/image";

// Use your exact SO4 brand green here if different:
const SO4_GREEN = "#2E7D32";

function CalculatorTile(props: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      href={props.href}
      className="group relative rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md"
    >
      {/* green accent on hover */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: SO4_GREEN }}
      />
      <div className="text-xl font-semibold text-gray-900">{props.title}</div>
      <div className="text-sm text-gray-600">{props.subtitle}</div>
      <div className="mt-2 text-sm text-blue-600 group-hover:underline">Open calculator →</div>
    </Link>
  );
}

export default function SO4Hub() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* slim brand bar */}
      <div className="h-2 w-full" style={{ backgroundColor: SO4_GREEN }} />

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-12 pt-8">
        {/* centered logo */}
        <div className="mb-4 flex w-full justify-center">
          <Image
            src="/logos/so4.png"   // ensure this exists in apps/web/public/logos/
            alt="SO4"
            width={480}
            height={144}
            className="h-14 w-auto object-contain md:h-16 lg:h-20"
            priority
          />
        </div>

        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
          SO4 Pelletized Gypsum
        </h1>
        <p className="mb-8 max-w-2xl text-center text-gray-600">
          Choose a calculator below.
        </p>

        {/* centered panel + tiles */}
        <div className="w-full rounded-3xl bg-gray-100/70 p-5">
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            <CalculatorTile
              href="/so4/sulfur"
              title="Sulfur Rate"
              subtitle="Crop-based SO4 recommendation"
            />
            <CalculatorTile
              href="/so4/high-mg"
              title="High Mg Amendment"
              subtitle="Lower %Mg via Ca displacement"
            />
            <CalculatorTile
              href="/so4/sodic"
              title="High Na Amendment"
              subtitle="Lower %Na via Ca displacement"
            />
          </div>
        </div>

        {/* centered back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Back to product selection
          </Link>
        </div>
      </section>
    </main>
  );
}
