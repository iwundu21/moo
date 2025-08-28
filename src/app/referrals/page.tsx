
'use client'

import { Button } from '@/components/ui/button';
import { Copy, UserPlus, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/hooks/use-telegram';

export default function ReferralsPage() {
    const { userProfile } = useTelegram();
    const { toast } = useToast();
    
    if (!userProfile) {
      return null; // Or a loading spinner
    }

    const userReferralCode = userProfile.referralCode || '';
    const referralLink = `https://t.me/Moo_airdrop_bot?start=ref${userReferralCode}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(userReferralCode);
        toast({
            title: "Copied!",
            description: "Referral code copied to clipboard.",
        });
    };

    const shareOnTelegram = () => {
        const shareText = `Join me on MOO and let's earn together! Use my referral code: ${userReferralCode}`;
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
        window.open(telegramShareUrl, '_blank');
    };

    return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="text-center space-y-2">
        <UserPlus className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Refer a Friend</h1>
        <p className="text-xs text-muted-foreground">Earn more MOO for every friend you invite!</p>
      </header>

      <div className="space-y-6">

        <div className="space-y-4 text-center">
            <p className="text-sm font-semibold">Your Referral Code</p>
            <div className="p-4 border-dashed border-2 border-primary/50 rounded-lg bg-primary/10 text-primary font-mono text-lg tracking-widest break-all">
                {userReferralCode}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button className="w-full" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Code
                </Button>
                <Button className="w-full" variant="outline" onClick={shareOnTelegram}>
                    <Share2 className="mr-2 h-4 w-4" /> Invite
                </Button>
            </div>
        </div>

      </div>
    </div>
  );
}
