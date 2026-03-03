"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Send, Loader2, CheckCircle2 } from "lucide-react";

const APPROVAL_TYPES = [
  { value: "OptLC1LAMZV", label: "보건연차" },
  { value: "OptDWJGFTNE", label: "생일연차" },
  { value: "OptVX9TTJMY", label: "연차" },
] as const;

export function ApprovalForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [approvalType, setApprovalType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    listItemId?: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !approvalType) {
      toast.error("유형과 제목은 필수입니다.");
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/slack/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: description
            ? `${title.trim()}\n${description.trim()}`
            : title.trim(),
          approvalType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "요청 실패");
      }

      setLastResult({
        success: true,
        message: data.message,
        listItemId: data.listItemId,
      });
      toast.success("전자결재가 성공적으로 발송되었습니다.");
      setTitle("");
      setDescription("");
      setApprovalType("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "알 수 없는 오류";
      setLastResult({ success: false, message });
      toast.error(`발송 실패: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                전자결재 발송
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Slack List에 항목을 추가하고 DM으로 결재 요청을 발송합니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="approval-type"
                className="text-sm font-medium text-foreground"
              >
                결재 유형
              </Label>
              <Select
                value={approvalType}
                onValueChange={setApprovalType}
                disabled={isLoading}
              >
                <SelectTrigger id="approval-type" className="bg-background">
                  <SelectValue placeholder="결재 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="approval-title"
                className="text-sm font-medium text-foreground"
              >
                결재 제목
              </Label>
              <Input
                id="approval-title"
                placeholder="예: 2026년 3월 출장 경비 정산"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                className="bg-background"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="approval-description"
                className="text-sm font-medium text-foreground"
              >
                결재 내용{" "}
                <span className="text-muted-foreground font-normal">
                  (선택)
                </span>
              </Label>
              <Textarea
                id="approval-description"
                placeholder="결재 내용을 상세히 입력해주세요..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="resize-none bg-background"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !title.trim() || !approvalType}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  전자결재 발송
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
              <CheckCircle2
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
                  {lastResult.success ? "발송 완료" : "발송 실패"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastResult.message}
                </p>
                {lastResult.listItemId && (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    List Item ID: {lastResult.listItemId}
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
              DM 메시지 미리보기
            </h4>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <span className="text-base font-bold text-foreground">
                    전자결재 도착
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="font-semibold">유형:</span>{" "}
                  {approvalType
                    ? APPROVAL_TYPES.find((t) => t.value === approvalType)
                        ?.label
                    : "결재 유형이 여기에 표시됩니다"}
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="font-semibold">제목:</span>{" "}
                  {title || "결재 제목이 여기에 표시됩니다"}
                </p>
                <p className="text-sm text-muted-foreground">
                  결재 문서가 도착했습니다. 아래 버튼을 통해 처리해주세요.
                </p>
                <div className="flex items-center gap-2 border-t border-border pt-3">
                  <span className="inline-flex items-center rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    의견등록
                  </span>
                  <span className="inline-flex items-center rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    승인
                  </span>
                  <span className="inline-flex items-center rounded bg-destructive px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    반려
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
