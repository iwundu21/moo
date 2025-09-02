
'use client'

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, UserPlus, Share2, Gift, Users, CheckCircle, XCircle } from 'lucide-react';
import { useTelegram } from '@/hooks/use-telegram';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type DialogInfo = {
  title: string;
  description: string;
  status: 'success' | 'error';
};

export default function ReferralsPage() {
    const { userProfile, referrals } = useTelegram();
    const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<DialogInfo | null>(null);
    
    if (!userProfile) {
      return null; // Or a loading spinner
    }

    const userReferralCode = userProfile.referralCode || '';
    const referralLink = `https://t.me/Moo_airdrop_bot?start=ref${userReferralCode}`;
    const referralMessage = `Join me on MOO and let's earn together! Use my referral code: ${userReferralCode}\n\nOr click the link:\n${referralLink}`;


    const copyToClipboard = (textToCopy: string, confirmationMessage: string) => {
        navigator.clipboard.writeText(textToCopy);
        setDialogContent({
            title: "Copied!",
            description: confirmationMessage,
            status: 'success'
        });
        setIsInfoDialogOpen(true);
    };

    return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="text-center space-y-2">
        <UserPlus className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Refer a Friend</h1>
        <p className="text-xs text-muted-foreground">Earn MOO for every friend you invite!</p>
      </header>

      <div className="space-y-6">

        <div className="space-y-4 text-center">
            <p className="text-sm font-semibold">Your Referral Code</p>
            <div className="p-4 border-dashed border-2 border-primary/50 rounded-lg bg-primary/10 text-primary font-mono text-lg tracking-widest break-all">
                {userReferralCode}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button className="w-full" onClick={() => copyToClipboard(userReferralCode, 'Referral code copied to clipboard.')}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Code
                </Button>
                <Button className="w-full" variant="outline" onClick={() => copyToClipboard(referralMessage, 'Invite message copied to clipboard.')}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Message
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary"/>
                    Your Referrals ({referrals.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {referrals.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {referrals.map((ref, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={ref.profilePictureUrl} data-ai-hint="profile picture" />
                                        <AvatarFallback>{ref.firstName.substring(0,1)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{ref.firstName}</span>
                                </div>
                                <Badge variant="secondary">Joined</Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">You haven't referred any friends yet.</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary"/>
                    How It Works
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
                <div className="flex items-start gap-4">
                    <span className="font-bold text-primary">1.</span>
                    <p>Share your unique referral code with your friends through social media, direct messages, or any way you like.</p>
                </div>
                <div className="flex items-start gap-4">
                    <span className="font-bold text-primary">2.</span>
                    <p>Your friend enters your referral code on the Home page. This completes one of their social tasks.</p>
                </div>
                <div className="flex items-start gap-4">
                    <span className="font-bold text-primary">3.</span>
                    <p>As a thank you, you will receive <span className="font-semibold text-foreground">100 MOO</span> in your main balance for each successful referral. The new user does not receive a MOO bonus for using the code. The more friends you invite, the more you earn!</p>
                </div>
            </CardContent>
        </Card>

      </div>

      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent>
          {dialogContent && (
            <>
              <DialogHeader>
                  <div className="flex flex-col items-center justify-center text-center p-6">
                      {dialogContent.status === 'success' ? (
                          <CheckCircle className="w-16 h-16 text-primary mb-4" />
                      ) : (
                          <XCircle className="w-16 h-16 text-destructive mb-4" />
                      )}
                      <DialogTitle className={cn("text-xl", dialogContent.status === 'success' ? 'text-primary' : 'text-destructive')}>
                        {dialogContent.title}
                      </DialogTitle>
                      <DialogDescription className="pt-2 text-center text-xs">
                          {dialogContent.description}
                      </DialogDescription>
                  </div>
              </DialogHeader>
              <DialogClose asChild>
                <Button className="w-full">
                    Continue
                </Button>
              </DialogClose>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
