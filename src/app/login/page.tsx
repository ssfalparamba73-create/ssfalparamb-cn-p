"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneIcon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setIsLoading(true);
    // Simulate API call for sending OTP
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to OTP verification page
      router.push(`/otp-verification?phone=${encodeURIComponent(phone)}`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <span className="font-cooper text-3xl text-primary">SSF</span>
          <p className="text-muted-foreground mt-2">Alparamba Unit</p>
        </div>
        
        <Card className="border-0 shadow-lg sm:p-2">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your mobile number to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter mobile number"
                    className="pl-9 h-11"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-base mt-2" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Get OTP"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4 mt-2">
            <p className="text-sm text-muted-foreground text-center">
              Having trouble? <a href="#" className="text-primary hover:underline font-medium">Contact Unit Admin</a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
