
'use client'

import { Button } from '@/components/ui/button';
import { Copy, UserPlus } from 'lucide-react';
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

    return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Refer a Friend</h1>
        <p className="text-muted-foreground">Earn more MOO for every friend you invite!</p>
      </header>

      <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-2xl font-semibold leading-none tracking-tight">Your Referral Link</h2>
        <div className="space-y-4 pt-2">
          <div className="p-3 border rounded-md bg-secondary/50 text-sm break-all">
            {referralLink}
          </div>
          <Button className="w-full" onClick={copyToClipboard}>
            <Copy className="mr-2 h-4 w-4" /> Copy Link
          </Button>
          <Button className="w-full" variant="outline">
            <UserPlus className="mr-2 h-4 w-4" /> Invite via Telegram
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className='px-2'>
          <h2 className="text-2xl font-semibold leading-none tracking-tight">Your Referrals ({referrals.length})</h2>
          <p className="text-sm text-muted-foreground pt-1.5">Friends who have joined using your link.</p>
        </div>
        <div className='rounded-lg border bg-card text-card-foreground shadow-sm p-4'>
            {referrals.length > 0 ? (
                <ul className="space-y-3">
                    {referrals.map((ref, index) => (
                        <li key={index} className="flex items-center gap-4 p-2 rounded-lg bg-secondary/50">
                            <Avatar>
                                <AvatarImage src={ref.profilePictureUrl} data-ai-hint="profile picture" />
                                <AvatarFallback>{ref.username.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">@{ref.username}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-muted-foreground py-4">You haven't referred anyone yet.</p>
            )}
        </div>
      </div>
    </div>
  );
}
