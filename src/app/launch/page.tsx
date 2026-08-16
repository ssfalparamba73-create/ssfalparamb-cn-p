import Image from "next/image";
import Link from "next/link";

export default function LaunchPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <section className="relative mx-auto hidden w-full max-w-[1692px] md:block">
        <Image
          src="/launch/ssf-alparamba-launch-final.png"
          alt="SSF Alparamba Unit app launch"
          width={1692}
          height={930}
          priority
          sizes="100vw"
          className="h-auto w-full object-contain"
        />

        <Link
          href="/"
          aria-label="Launch the SSF Alparamba Unit app"
          className="absolute left-[5.3%] top-[72.7%] h-[11.5%] w-[23%] rounded-[1.5rem] outline-none transition focus-visible:ring-4 focus-visible:ring-blue-300"
        />
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 text-center md:hidden">
        <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="font-cooper text-4xl tracking-wide text-[#2563eb]">SSF</p>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Open this launch page on a desktop
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            The launch artwork is designed for desktop screens.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-[#2563eb] px-5 py-3 font-semibold text-white"
          >
            Open payment portal
          </Link>
        </div>
      </section>
    </main>
  );
}
