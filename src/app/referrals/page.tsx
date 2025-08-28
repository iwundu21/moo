
'use client'

import { Button } from '@/components/ui/button';
import { Copy, UserPlus, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/hooks/use-telegram';

export default function ReferralsPage() {
    const { userProfile, referrals } = useTelegram();
    const { toast } = useToast();
    
    if (!userProfile) {
      return null; // Or a loading spinner
    }

    const referralLink = `https://t.me/moo_app_bot?start=ref${userProfile.id}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Copied!",
            description: "Referral link copied to clipboard.",
        });
    };

    const shareOnTelegram = () => {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on MOO and let\'s earn together!')}`;
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
            <p className="text-sm font-semibold">Your Referral Link</p>
            <div className="p-4 border-dashed border-2 border-primary/50 rounded-lg bg-primary/10 text-primary font-mono text-xs break-all">
                {referralLink}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button className="w-full" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4" /> Copy
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
