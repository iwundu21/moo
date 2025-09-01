
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function InfoPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-xl font-bold tracking-tight">MOO Whitepaper</h1>
        <p className="text-xs text-muted-foreground">The official documentation for the MOO Cow.</p>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              Moo is a community-driven meme coin built on the TON (The Open Network) blockchain. Designed for fun, virality, and accessibility, Moo combines the cultural appeal of meme tokens with the technical strengths of the TON ecosystem. It aims to create a lighthearted, engaging digital asset that thrives within Telegram’s ecosystem and beyond.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vision & Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p><span className="font-semibold text-foreground">Vision:</span> To become the leading meme coin within the TON ecosystem, driving community adoption and fun financial engagement.</p>
            <p><span className="font-semibold text-foreground">Mission:</span> To deliver a simple, engaging, and viral crypto experience that leverages TON’s speed, scalability, and Telegram integration to reach millions of users worldwide.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <ol className="list-decimal pl-5 space-y-2">
                <li><span className="font-semibold text-foreground">TON Blockchain Integration:</span> Moo runs natively on the TON blockchain, benefiting from fast transactions, low fees, and native Telegram wallet compatibility.</li>
                <li><span className="font-semibold text-foreground">Community First:</span> No central governance — Moo thrives on community energy, memes, and grassroots adoption.</li>
                <li><span className="font-semibold text-foreground">Earn & Engage:</span> Telegram mini-apps (like Moo Coin) enable users to earn Moo through chat activity, social tasks, and gamified experiences.</li>
                <li><span className="font-semibold text-foreground">Meme Power:</span> Branding and virality are at the project’s core, with Moo positioned as both a fun digital identity and a token of value within the TON ecosystem.</li>
            </ol>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Roadmap</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
             <ol className="list-decimal pl-5 space-y-4">
                <li>
                    <span className="font-semibold text-foreground">Phase 1: Foundation & Community</span>
                    <p>Launch Moo Coin mini-app for community engagement. Build initial community through Telegram groups, memes, and contests. Reward early adopters via chat activity and referral programs.</p>
                </li>
                <li>
                    <span className="font-semibold text-foreground">Phase 2: Token Deployment & Growth</span>
                    <p>Deploy Moo token on TON network. Official Moo Airdrop Claim for early adopters & community supporters. Strategic CEX & DEX listings. Community rewards and referral campaigns. Ecosystem integrations (games, dApps, tipping).</p>
                </li>
                 <li>
                    <span className="font-semibold text-foreground">Phase 3: Expansion & Utility</span>
                    <p>Branded NFTs and collectibles. Partnerships with Telegram communities and influencers. Expansion of use cases (payments, gamification, tipping economy).</p>
                </li>
            </ol>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Why Moo?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-semibold text-foreground">Fun + Utility:</span> Unlike many meme coins, Moo combines humor with real TON-based applications.</li>
                <li><span className="font-semibold text-foreground">TON Ecosystem Advantage:</span> Direct access to Telegram’s massive user base via TON wallet integration.</li>
                <li><span className="font-semibold text-foreground">Community-Driven Growth:</span> Built to scale with memes, social sharing, and collective energy.</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Conclusion</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
             Moo is more than a meme coin — it is a movement to bring together fun, community, and blockchain utility on the TON network. By leveraging TON’s unique integration with Telegram, Moo is positioned to achieve viral adoption while creating real digital engagement opportunities.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
