import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CodeBlockLine } from "@/components/ui/code-block";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppFieldId, AppRow } from "@/content/types";
import { browserClock, createSweep } from "@/motion/player";
import { SampleCode } from "./SampleCode";

const tone: Record<AppFieldId, string> = {
  method: "bg-blue-100 text-blue-800",
  target: "bg-violet-100 text-violet-800",
  host: "bg-amber-100 text-amber-950",
};

function markToken(line: string, field: AppFieldId, index: number) {
  if (index === 0 && line.startsWith("curl ")) {
    return (
      <>
        curl https://
        <span className={field === "host" ? "rounded bg-amber-100 px-0.5" : undefined}>example.com</span>
        <span className={field === "target" ? "rounded bg-violet-100 px-0.5" : undefined}>/docs</span>
      </>
    );
  }
  if (line.startsWith("GET ")) {
    const docsAt = line.indexOf("/docs");
    return (
      <>
        <span className={field === "method" ? "rounded bg-blue-100 px-0.5" : undefined}>GET</span>
        {docsAt >= 0 ? (
          <>
            {line.slice(3, docsAt)}
            <span className={field === "target" ? "rounded bg-violet-100 px-0.5" : undefined}>/docs</span>
            {line.slice(docsAt + 5)}
          </>
        ) : (
          line.slice(3)
        )}
      </>
    );
  }
  if (line.startsWith("Host:")) {
    return <span className={field === "host" ? "rounded bg-amber-100 px-0.5" : undefined}>{line}</span>;
  }
  return line;
}

function Wire({
  title,
  value,
  text,
  field,
  activeLine,
  badge,
}: {
  title: string;
  value: string;
  text: string;
  field: AppFieldId;
  activeLine: number;
  badge?: string;
}) {
  const lines = text.split("\n");
  return (
    <SampleCode title={title} value={value} extra={badge ? <Badge className="ml-2">{badge}</Badge> : null}>
      {lines.map((line, index) => (
        <CodeBlockLine key={`${title}-${index}`} variant={index === activeLine ? "highlighted" : "default"}>
          {markToken(line, field, index)}
        </CodeBlockLine>
      ))}
    </SampleCode>
  );
}

export function ApplicationCompare({
  intro,
  browserTitle,
  browser,
  curlTitle,
  curl,
  rows,
  initialId,
}: {
  intro: string;
  browserTitle: string;
  browser: string;
  curlTitle: string;
  curl: string;
  rows: AppRow[];
  initialId: string;
}) {
  const initial = rows.find((row) => row.id === initialId) ?? rows[0];
  const [fieldId, setFieldId] = useState(initial.id);
  const [sweep, setSweep] = useState(1);
  const sweepRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    const clock = browserClock();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const player = createSweep({
      durationMs: reduced ? 1 : 460,
      clock,
      onChange: setSweep,
    });
    sweepRef.current = player;
    return () => player.stop();
  }, []);

  const row = rows.find((item) => item.id === fieldId) ?? rows[0];

  function pick(id: AppFieldId) {
    setFieldId(id);
    setSweep(0);
    sweepRef.current?.start();
  }

  const browserBlock = (
    <Wire title={browserTitle} value={browser} text={browser} field={row.id} activeLine={row.browserLine} />
  );
  const curlBlock = (
    <Wire
      title={curlTitle}
      value={curl}
      text={curl}
      field={row.id}
      activeLine={row.curlLine}
      badge={row.id === "method" ? "默认 GET" : undefined}
    />
  );

  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-slate-600">{intro}</p>
      <Tabs defaultValue="split">
        <TabsList>
          <TabsTrigger value="split">并排对照</TabsTrigger>
          <TabsTrigger value="browser">浏览器记录</TabsTrigger>
          <TabsTrigger value="curl">curl</TabsTrigger>
        </TabsList>
        <TabsContent value="split" className="mt-3 grid gap-3 lg:grid-cols-2">
          {browserBlock}
          {curlBlock}
        </TabsContent>
        <TabsContent value="browser" className="mt-3">
          {browserBlock}
        </TabsContent>
        <TabsContent value="curl" className="mt-3">
          {curlBlock}
        </TabsContent>
      </Tabs>
      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            data-testid="field-marker"
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
            style={{ width: `${Math.round(sweep * 100)}%`, transition: "none" }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">正在标出：{row.field}</p>
      </div>
      <Card className="rounded-2xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>字段</TableHead>
              <TableHead>浏览器记录</TableHead>
              <TableHead>curl</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id} data-state={item.id === row.id ? "selected" : undefined} className={item.id === row.id ? "bg-slate-50" : undefined}>
                <TableCell>
                  <Button size="sm" variant={item.id === row.id ? "default" : "outline"} onClick={() => pick(item.id)}>
                    {item.field}
                  </Button>
                </TableCell>
                <TableCell>{item.browser}</TableCell>
                <TableCell>{item.curl}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Separator />
      <div className="rounded-2xl border border-indigo-100 border-l-4 border-l-indigo-500 bg-indigo-50/60 p-4" aria-live="polite">
        <Badge className={tone[row.id]}>{row.field}</Badge>
        <p className="mt-2 text-sm leading-6">{row.note}</p>
      </div>
    </div>
  );
}
