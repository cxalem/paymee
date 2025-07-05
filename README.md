# Paymee Web3  

**Payment links for freelancers – get paid in crypto from any chain.**  

---

## ✨ Overview  
Paymee Web3 lets any freelancer generate a shareable link their clients can pay with—no matter which blockchain or token the client prefers. Under the hood we combine three battle-tested primitives:

1. **Privy** – password-less onboarding and embedded, hardware-secured wallets.  
2. **LayerZero V2** – omnichain messaging so payments can arrive from *any* EVM/L2/Solana/… chain and settle in the freelancer’s wallet.  
3. **World ID** – proof-of-personhood ("one human, one account") to curb fraud and sybil attacks.

The result is a friction-less payment UX for both sides:  
• Clients can pay with the wallet & chain they already use.  
• Freelancers receive funds directly, self-custodially, with zero bridge setup.

---

## 🏗 Architecture  
```mermaid
graph TD
    subgraph "Frontend (packages/site)"
        A[Next.js - React 19] --> B(Privy SDK)
        A --> C(World ID Widget)
        A --> D(Payment Link Page)
    end

    subgraph "Contracts (packages/blockchain)"
        E[PaymeeRouter.sol] -->|lzSend| F[LayerZero Endpoint]
    end

    B --> G[User Wallet (Privy)]
    C --> H[World ID Proof]
    F --> I[Destination Chain(s)]
    I --> G
```

Flow: a verified freelancer mints a payment link. When a client pays, the Paymee Router contract forwards the payment across chains via LayerZero, crediting the freelancer’s Privy wallet.

---

## 🧰 Tech Stack

• Next.js 15 (App Router + Turbopack)  
• TypeScript & React 19  
• Tailwind CSS 4  
• Privy JS & embedded wallets  
• LayerZero V2 SDK / OApp contracts  
• World ID JS Widget  
• Turbo Repo + pnpm workspace  

---

## 🚀 Getting Started

### Prerequisites

```bash
# Node 20 + pnpm 10 recommended
brew install fnm && fnm install 20
npm i -g pnpm@10
```

### Setup

```bash
git clone https://github.com/your-org/paymee-web3.git
cd paymee-web3
pnpm install

# copy environment variables
cp .env.example .env
```

Open `.env` and add the following keys (you’ll get them from the respective dashboards):

```bash
PRIVY_APP_ID=
WORLD_ID_APP_ID=
LZ_ENDPOINT_ID_MAINNET=
LZ_ENDPOINT_ID_TESTNET=
```

### Run locally

```bash
# all packages via turborepo
pnpm dev
```

The Next.js app will be accessible at http://localhost:3000.

### Building for production

```bash
pnpm build  # runs `turbo build`
```

---

## 📁 Monorepo Layout

```
.
├── packages
│   ├── site        # Next.js frontend
│   └── blockchain  # Solidity/Hardhat contracts (LayerZero OApp)
├── turbo.json      # Turborepo pipeline
└── pnpm-workspace.yaml
```

---

## 📝 Scripts

At the repo root:

| Script | Description |
| ------ | ----------- |
| `pnpm dev` | Runs `turbo dev` – starts `next dev` & contract watchers |
| `pnpm build` | Production builds for all packages |
| `pnpm lint` | Eslint across workspace |
| `pnpm format` | Prettier write check |

Each package also exposes its own scripts (see their `package.json`).

---

## 👩‍💻 Contributing

1. Fork & clone the repo.  
2. Create a new branch: `git checkout -b feat/your-feature`.  
3. Follow the commit convention: `feat(component): add cool thing`.  
4. Ensure `pnpm lint` & `pnpm test` pass.  
5. Open a PR — we squash & merge.

All contributions ‑ code, docs, ideas ‑ are welcome! ⭐️

---

## 🛡 License

MIT © 2025 Paymee.
