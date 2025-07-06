import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

export default function Home() {
  return (
    <div className="items-center min-h-screen gap-16 font-[family-name:var(--font-geist-sans)]">
      <nav className="flex w-full justify-between items-center max-w-screen-lg mx-auto py-4 px-2 md:px-0">
        <span className="text-2xl font-black cursor-pointer">PayMee Web3</span>
        <div>
          <Link
            className="bg-neutral-800 text-sm text-neutral-50 py-3 px-5 rounded-md hover:bg-neutral-700 transition-colors"
            href="/login"
          >
            Start Receiving
          </Link>
        </div>
      </nav>

      <div className="flex flex-col items-center justify-center mt-20 px-4">
        <div
          className="max-w-7xl flex items-center justify-center bg-[#18141B] w-full rounded-2xl px-12 min-h-[80vh] md:p-16 shadow-2xl relative overflow-hidden"
        >
          {/* Background circles with blur */}
          <div
            className="absolute -top-32 -left-20 w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: "#8900F0" }}
          ></div>
          <div
            className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full blur-3xl opacity-25"
            style={{ backgroundColor: "#0088F0" }}
          ></div>

          {/* Content */}
          <div className="text-center space-y-6 relative z-10">
            <h1
              className={`text-5xl md:text-7xl font-bold text-white ${montserrat.className}`}
            >
              PayMee
            </h1>
            <p className="text-lg md:text-xl text-gray-200 font-light max-w-2xl mx-auto leading-relaxed">
              The easiest way to pay non Web3 people across chains — secure,
              seamless, multichain.
            </p>

            <div className="pt-8 space-y-4">
              <p className="text-sm text-gray-300 font-medium">Powered By:</p>
              <div className="flex items-center justify-center gap-8 md:gap-12">
                <div className="flex items-center">
                  <Image
                    src="/images/layer-zero-logo.svg"
                    alt="LayerZero"
                    width={120}
                    height={40}
                    className="h-8 w-auto brightness-0 invert"
                  />
                </div>
                <div className="flex items-center">
                  <Image
                    src="/images/privy-logo.png"
                    alt="Privy"
                    width={100}
                    height={40}
                    className="h-8 w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
