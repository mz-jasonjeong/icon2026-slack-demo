"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalForm } from "@/components/approval-form";
import { VacationStatusForm } from "@/components/vacation-status-form";
import { WarRoomForm } from "@/components/war-room-form";
import { FileText, PalmtreeIcon, BellElectric } from "lucide-react";

export function SlackDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-primary-foreground"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground text-balance">
              Megazone ICON 2026 Slack Demo
            </h1>
            <p className="text-sm text-muted-foreground">
              
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <Tabs defaultValue="approval" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger
              value="approval"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              <span>전자결재</span>
            </TabsTrigger>
            <TabsTrigger
              value="vacation"
              className="flex items-center gap-2"
            >
              <PalmtreeIcon className="h-4 w-4" />
              <span>휴가 상태</span>
            </TabsTrigger>

            <TabsTrigger
              value="warroom"
              className="flex items-center gap-2"
            >
              <BellElectric className="h-4 w-4" />
              <span>War Room 구축</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approval">
            <ApprovalForm />
          </TabsContent>

          <TabsContent value="vacation">
            <VacationStatusForm />
          </TabsContent>

          <TabsContent value="warroom">
            <WarRoomForm />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border bg-card py-4">
        <div className="mx-auto max-w-2xl px-4">
          <p className="text-center text-xs text-muted-foreground">
            Slack Demo
          </p>
        </div>
      </footer>
    </div>
  );
}
