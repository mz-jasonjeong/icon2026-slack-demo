"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { CalendarIcon, Loader2, PalmtreeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function VacationStatusForm() {
  const today = useMemo(() => new Date(), []);
  const [date, setDate] = useState<Date>(today);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    expiration?: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const dateString = format(date, "yyyy-MM-dd");
      const res = await fetch("/api/slack/vacation-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateString }),
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
              <PalmtreeIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                휴가 상태 적용
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Slack 프로필에 휴가 상태를 설정합니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="vacation-date"
                className="text-sm font-medium text-foreground"
              >
                휴가 날짜
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="vacation-date"
                    variant="outline"
                    disabled={isLoading}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date
                      ? format(date, "yyyy년 M월 d일 (EEEE)", { locale: ko })
                      : "날짜를 선택하세요"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    locale={ko}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                선택한 날짜의 한국시간 23:59:59에 상태가 자동으로 해제됩니다.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !date}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  적용 중...
                </>
              ) : (
                <>
                  <PalmtreeIcon className="mr-2 h-4 w-4" />
                  상태 적용
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
              <PalmtreeIcon
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
                  {lastResult.success ? "적용 완료" : "적용 실패"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastResult.message}
                </p>
                {lastResult.expiration && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    만료 시각:{" "}
                    {new Date(lastResult.expiration).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground">
              적용 결과 미리보기
            </h4>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <span className="text-2xl" role="img" aria-label="palm tree">
                    {"🌴"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    사용자 상태
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg" role="img" aria-label="palm tree">
                      {"🌴"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      휴가중
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {date
                      ? `${format(date, "yyyy년 M월 d일", { locale: ko })} 23:59:59 KST 만료`
                      : "날짜를 선택하세요"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
