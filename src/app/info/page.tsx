
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function InfoPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-xl font-bold tracking-tight">MOO Whitepaper</h1>
        <p className="text-xs text-muted-foreground">The official documentation for the MOO Protocol.</p>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Abstract</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              MOO 🐮 is a meme coin on the TON blockchain, created to unite communities through humor, virality, and decentralized technology. Inspired by the internet’s love for memes and the unstoppable cow energy, MOO is designed to be the funniest, friendliest, and most bullish meme coin on TON.
            </p>
            <p>
              MOO is not about governance or complicated mechanics — it’s about community, liquidity, and endless memeability.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vision & Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p><span className="font-semibold text-foreground">Vision:</span> Become the #1 meme coin on TON, spreading joy, memes, and “cow power” across the blockchain.</p>
            <p><span className="font-semibold text-foreground">Mission:</span> Build a fun, engaging, and rewarding ecosystem on TON, backed by strong liquidity, viral marketing, and meme-driven growth.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Why TON?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-semibold text-foreground">Fast & Scalable:</span> TON is built for mass adoption with lightning-fast transactions.</li>
                <li><span className="font-semibold text-foreground">Low Fees:</span> Micro-transactions make MOO trading cheap & accessible.</li>
                <li><span className="font-semibold text-foreground">Ecosystem Growth:</span> TON is rapidly expanding with integrations into Telegram, the world’s largest messaging platform.</li>
            </ul>
            <p className="font-semibold text-foreground pt-2">MOO is perfectly positioned to ride TON’s explosive growth.</p>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Roadmap 🗺️</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
             <ol className="list-decimal pl-5 space-y-4">
                <li>
                    <span className="font-semibold text-foreground">Phase 1 – The Herd Awakens</span>
                    <p>Brand & community launch. Meme campaigns (“Got MOO?” 🐮). Build strong Telegram & X communities. Viral marketing + meme contests. MOO integration into Telegram mini-apps (stickers, bots, tipping).</p>
                </li>
                <li>
                    <span className="font-semibold text-foreground">Phase 2 – The Big Stampede</span>
                    <p>Token launch on TON (Jetton standard). Initial liquidity pool setup on TON-native DEXs. Top-tier CEX listings (Binance, OKX, Bybit target). Strategic airdrops to early community members. Global awareness campaign (“The Herd Takes Over”).</p>
                </li>
                 <li>
                    <span className="font-semibold text-foreground">Phase 3 – Farm Expansion</span>
                    <p>Meme NFT collection (“Cows of MOO-verse”). Collaborations with TON ecosystem projects. Community-driven meme contests & rewards. Additional mid-tier CEX listings.</p>
                </li>
                <li>
                    <span className="font-semibold text-foreground">Phase 4 – Global Domination</span>
                    <p>IRL meme events & merch drops. Large-scale global meme campaigns. Expansion into cross-chain TON bridges.</p>
                </li>
            </ol>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Security & Transparency</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <ul className="list-disc pl-5 space-y-2">
                <li>Smart contracts deployed under Jetton standard.</li>
                <li>Liquidity locked to ensure trust.</li>
                <li>No governance: simple, meme-driven token.</li>
                <li>Transparent distribution & open community channels.</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Conclusion</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              MOO 🐮 is a pure meme coin built on TON for speed, low fees, and massive Telegram-native adoption. By focusing on memes, virality, and community engagement, MOO aims to become the undisputed king of memes on TON.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
