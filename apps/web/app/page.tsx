import Link from "next/link";
import Image from "next/image";

type TileProps = {
  href: string;
  title: string;
  subtitle: string;
  logoSrc: string;
  logoAlt: string;
  accentColor: string;
};

function ProductTile({
  href,
  title,
  subtitle,
  logoSrc,
  logoAlt,
  accentColor,
}: TileProps) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-gray-200">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={72}
          height={72}
          className="h-14 w-14 object-contain transition-transform group-hover:scale-105"
          priority={false}
        />
      </div>

      <div>
        <div className="text-xl font-semibold text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{subtitle}</div>
        <div
          className="mt-1 text-sm group-hover:underline"
          style={{ color: accentColor }}
        >
          Go to Calculators →
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="h-2 w-full bg-[#B21F2D]" />

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-12 pt-8">
        <div className="mb-6">
          <a
            href="https://www.calciumproducts.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Calcium Products website"
          >
            <Image
              src="/logos/cplogo.png"
              alt="Calcium Products"
              width={720}
              height={220}
              sizes="(max-width: 768px) 360px, (max-width: 1024px) 540px, 720px"
              className="h-24 w-auto object-contain md:h-32 lg:h-36"
              priority
            />
          </a>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">Product Calculators</h1>
        <p className="mb-8 max-w-2xl text-center text-gray-600">
          Choose a product to open its calculators.
        </p>

        <div className="w-full rounded-3xl bg-gray-100/70 p-5">
          <div className="grid w-full gap-6 sm:grid-cols-2">
            <ProductTile
              href="/98g"
              title="98G"
              subtitle="Pelletized Limestone"
              logoSrc="/logos/98g.png"
              logoAlt="98G"
              accentColor="#B21F2D"
            />
            <ProductTile
              href="/so4"
              title="SO4"
              subtitle="Pelletized Gypsum"
              logoSrc="/logos/so4.png"
              logoAlt="SO4"
              accentColor="#2E7D32"
            />
          </div>
        </div>
      </section>
    </main>
  );
}