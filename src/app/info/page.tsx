'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';

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
            <CardTitle>Introduction</CardTitle>
            <CardDescription>What is MOO?</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              MOO is a revolutionary decentralized protocol built on the Telegram Open Network (TON) that introduces a new paradigm for community engagement and rewards. By leveraging the social fabric of Telegram, MOO transforms everyday user interactions into a rewarding experience.
            </p>
            <p>
              The core concept is simple: users earn MOO tokens by being active in their favorite Telegram groups. This creates a vibrant, self-sustaining ecosystem where community participation is directly incentivized.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tokenomics</CardTitle>
             <CardDescription>Understanding the MOO Token</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              The MOO token is the native utility token of the protocol. It serves multiple purposes within the ecosystem, including:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><span className="font-semibold text-foreground">Staking:</span> Users can stake MOO tokens to earn additional rewards and participate in governance.</li>
              <li><span className="font-semibold text-foreground">Boosts:</span> MOO can be used to purchase in-app boosts, increasing a user's earning potential.</li>
              <li><span className="font-semibold text-foreground">Governance:</span> Token holders can vote on proposals to shape the future development of the protocol.</li>
            </ul>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Roadmap</CardTitle>
             <CardDescription>The Future of MOO</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
             <ol className="list-decimal pl-5 space-y-4">
                <li>
                    <span className="font-semibold text-foreground">Q3 2024: Protocol Launch</span>
                    <p>Initial launch of the MOO Mini App, including core features like profile tracking, chat earning, and the referral program.</p>
                </li>
                <li>
                    <span className="font-semibold text-foreground">Q4 2024: Governance & Staking</span>
                    <p>Introduction of the MOO DAO, allowing token holders to vote on key protocol parameters. Staking pools will be launched.</p>
                </li>
                 <li>
                    <span className="font-semibold text-foreground">Q1 2025: Expanded Ecosystem</span>
                    <p>Integration with other TON-based DeFi protocols and launch of the MOO NFT marketplace for exclusive digital collectibles.</p>
                </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
