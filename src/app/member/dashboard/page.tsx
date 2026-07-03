"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MemberDashboardPlaceholder() {
  return (
    <div className="min-h-screen bg-secondary p-4 flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Member Dashboard</h1>
        <p className="text-muted-foreground">This page is scheduled for Phase 2 development.</p>
        <div className="pt-4">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
