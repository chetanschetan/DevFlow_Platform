import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function VerifyEmail() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const verifyMutation = useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const response = await api.auth.verifyEmail(data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email verified successfully! You can now login.",
      });
      setLocation('/login');
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.auth.resendOTP({ email });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Verification code resent!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter all 6 digits",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate({ email, code });
  };

  const handleResend = () => {
    if (email) {
      resendMutation.mutate(email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification code to your email
          </CardDescription>
        </CardHeader>
        <CardContent>
          {email && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Verification code sent to <strong>{email}</strong>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input w-12 h-12 text-center text-lg font-semibold"
                />
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Account
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
