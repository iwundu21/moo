
'use client'

import { Button } from '@/components/ui/button';
import { Copy, UserPlus, Share2, Ticket } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/hooks/use-telegram';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ReferralsPage() {
    const { userProfile, referrals, redeemReferralCode } = useTelegram();
    const { toast } = useToast();
    const [referralCodeInput, setReferralCodeInput] = useState('');
    
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

    const handleRedeemCode = () => {
      if (!referralCodeInput.trim()) {
          toast({
              title: "Error",
              description: "Please enter a referral code.",
              variant: "destructive",
          });
          return;
      }
      
      const result = redeemReferralCode(referralCodeInput.trim().toUpperCase());

      toast({
          title: result.success ? "Success!" : "Error",
          description: result.message,
          variant: result.success ? "default" : "destructive",
      });

      if (result.success) {
        setReferralCodeInput('');
      }
    };


    return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="text-center space-y-2">
        <UserPlus className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Refer a Friend</h1>
        <p className="text-xs text-muted-foreground">Earn more MOO for every friend you invite!</p>
      </header>

      <div className="space-y-6">

        <div className="space-y-4">
          <p className="text-sm font-semibold text-center">Redeem a Referral Code</p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="referral-code-input" className="sr-only">Referral Code</Label>
            <Input 
              id="referral-code-input"
              placeholder="Enter friend's referral code (e.g., M1A2B3)"
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value)}
              className="uppercase"
            />
            <Button onClick={handleRedeemCode}>
              <Ticket className="mr-2 h-4 w-4" /> Redeem Code
            </Button>
          </div>
        </div>

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

        <div className="space-y-4">
            <h2 className="text-base font-semibold leading-none tracking-tight text-center">Your Referrals ({referrals.length})</h2>
            <div className='p-2'>
                {referrals.length > 0 ? (
                    <ul className="space-y-3">
                        {referrals.map((ref, index) => (
                            <li key={index} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 backdrop-blur-sm border border-border/50">
                                <Avatar className="w-10 h-10 border-2 border-primary/50">
                                    <AvatarImage src={ref.profilePictureUrl} data-ai-hint="profile picture" />
                                    <AvatarFallback>{ref.username.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-sm">@{ref.username}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">You haven't referred anyone yet.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
