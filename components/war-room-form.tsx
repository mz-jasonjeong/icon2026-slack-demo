"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { CalendarIcon, Loader2, PalmtreeIcon, BellElectric } from "lucide-react";

export function WarRoomForm() {
  const [title, setTitle] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    expiration?: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // if (!date) {
    //   toast.error("날짜를 선택해주세요.");
    //   return;
    // }

    setIsLoading(true);
    setLastResult(null);

    try {
      
      const res = await fetch("/api/slack/war-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueTitle: title }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "요청 실패");
      }

      setLastResult({
        success: true,
        message: data.message,
        expiration: data.expiration,
      });
      toast.success("휴가 상태가 적용되었습니다.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "알 수 없는 오류";
      setLastResult({ success: false, message });
      toast.error(`상태 적용 실패: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <BellElectric className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                War Room 구축
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                장애 대응 채널 생성 및 관련 사용자를 초대합니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="issue-title"
                className="text-sm font-medium text-foreground"
              >
                이슈 제목
              </Label>
              <Input
                id="issue-title"
                placeholder="예: CRM 접속 장애"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                className="bg-background"
              />
            </div>

              <p className="text-xs text-muted-foreground">
                중복 채널 생성이 불가하므로 제목 뒤에 Timestamp가 추가됩니다.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !title}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  개설 중...
                </>
              ) : (
                <>
                  <BellElectric className="mr-2 h-4 w-4" />
                  War Room 개설
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {lastResult && (
        <Card
          className={
            lastResult.success
              ? "border-accent/30 bg-accent/5"
              : "border-destructive/30 bg-destructive/5"
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <BellElectric
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  lastResult.success ? "text-accent" : "text-destructive"
                }`}
              />
              <div className="flex flex-col gap-1">
                <p
                  className={`text-sm font-medium ${
                    lastResult.success
                      ? "text-accent"
                      : "text-destructive"
                  }`}
                >
                  {lastResult.success ? "개설 완료" : "개설 실패"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastResult.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      
    </div>
  );
}
