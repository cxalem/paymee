import Link from "next/link";

export default function Home() {
  return (
    <div className="items-center min-h-screen pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      <nav className="flex w-full justify-between items-center max-w-screen-lg mx-auto py-4 px-2 md:px-0">
        <span className="text-xl font-bold cursor-pointer">PayMee Web3</span>
        <div>
          <Link
            className="bg-neutral-800 text-sm text-neutral-50 py-3 px-5 rounded-md hover:bg-neutral-700 transition-colors"
            href="/login"
          >
            Start Receiving
          </Link>
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center mt-36">
        <h1 className="text-6xl max-w-xl text-center font-bold">
          Best way to receive payments
        </h1>
        <p className="text-lg text-center">Anywhere, at any time</p>
      </div>
    </div>
  );
}
