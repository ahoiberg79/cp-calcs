// apps/web/app/98g/page.tsx
import Link from "next/link";
import Image from "next/image";

function CalculatorTile(props: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      href={props.href}
      className="group relative rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md"
    >
      {/* red accent on hover */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-[#B21F2D] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="text-xl font-semibold text-gray-900">{props.title}</div>
      <div className="text-sm text-gray-600">{props.subtitle}</div>
      <div className="mt-2 text-sm text-blue-600 group-hover:underline">Open calculator →</div>
    </Link>
  );
}

export default function NinetyEightGHub() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* slim brand bar */}
      <div className="h-2 w-full bg-[#B21F2D]" />

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-12 pt-8">
        {/* centered logo */}
        <div className="mb-4 flex w-full justify-center">
          <Image
            src="/logos/98g.png"
            alt="98G"
            width={480}
            height={144}
            className="h-14 w-auto object-contain md:h-16 lg:h-20"
            priority
          />
        </div>

        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
          98G Pelletized Limestone
        </h1>
        <p className="mb-8 max-w-2xl text-center text-gray-600">
          Choose a calculator below.
        </p>

        {/* centered panel + tiles */}
        <div className="w-full rounded-3xl bg-gray-100/70 p-5">
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            <CalculatorTile
              href="/98g/acidification"
              title="Fertilizer Acidity"
              subtitle="98G required to neutralize fertilizer acidity"
            />
            <CalculatorTile
              href="/98g/98gvsaglime"
              title="98G vs Aglime"
              subtitle="Compare rates & ROI (UW/ISU)"
            />
            <CalculatorTile
              href="/98g/ph_efficiency"
              title="pH Efficiency"
              subtitle="Nutrient $ at risk vs. soil pH (N, P, K, S)"
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
