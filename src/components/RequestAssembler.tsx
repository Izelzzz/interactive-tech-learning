import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlockLine } from "@/components/ui/code-block";
import type { AssembleBeat, FieldId } from "@/content/types";
import { browserClock, createSweep, createTyper } from "@/motion/player";
import { SampleCode } from "./SampleCode";

const playClass =
  "border-0 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-sm hover:from-indigo-500 hover:to-cyan-300";

const tone: Record<FieldId, string> = {
  method: "data-[active=true]:bg-blue-600 data-[active=true]:text-white",
  target: "data-[active=true]:bg-violet-600 data-[active=true]:text-white",
  header: "data-[active=true]:bg-amber-500 data-[active=true]:text-white",
  body: "data-[active=true]:bg-slate-700 data-[active=true]:text-white",
};

function highlightLine(beatId: string, index: number, count: number): boolean {
  if (beatId === "header") return index === 1;
  if (beatId === "body") return index === Math.max(0, count - 1);
  return index === 0;
}

function decorate(line: string, beatId: string, index: number) {
  if (index === 0 && line.startsWith("GET")) {
    const rest = line.slice(3);
    const docsAt = rest.indexOf("/docs");
    return (
      <>
        <span className={beatId === "method" ? "rounded bg-blue-100 px-0.5 text-blue-800" : undefined}>GET</span>
        {docsAt >= 0 ? (
          <>
            {rest.slice(0, docsAt)}
            <span className={beatId === "target" ? "rounded bg-violet-100 px-0.5 text-violet-800" : undefined}>
              /docs
            </span>
            {rest.slice(docsAt + 5)}
          </>
        ) : (
          rest
        )}
      </>
    );
  }
  if (line.startsWith("Host:")) {
    return (
      <span className={beatId === "header" ? "rounded bg-amber-100 px-0.5 text-amber-950" : undefined}>{line}</span>
    );
  }
  if (line === "" && beatId === "body") return <span className="text-slate-400">（无正文）</span>;
  return line;
}

export function RequestAssembler({
  beats,
  initialId,
  prompt,
}: {
  beats: AssembleBeat[];
  initialId: string;
  prompt: string;
}) {
  const initial = beats.find((beat) => beat.id === initialId) ?? beats[0];
  const resting = beats.at(-1)?.text ?? initial.text;
  const [text, setText] = useState(resting);
  const [beatId, setBeatId] = useState<string>(initial.id);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [sweep, setSweep] = useState(1);
  const api = useRef<{
    play: () => void;
    pause: () => void;
    jump: (id: string) => void;
    mark: () => void;
  } | null>(null);

  useEffect(() => {
    const clock = browserClock();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const typer = createTyper({
      beats: beats.map((beat) => ({ id: beat.id, text: beat.text })),
      charsPerSecond: reduced ? 240 : 28,
      holdMs: reduced ? 180 : 720,
      clock,
      onChange: (state) => {
        setText(state.text);
        setBeatId(state.beatId);
        setPlaying(state.playing);
        setDone(state.done);
      },
    });
    const sweepPlayer = createSweep({
      durationMs: reduced ? 1 : 460,
      clock,
      onChange: setSweep,
    });
    api.current = {
      play: () => typer.play(),
      pause: () => typer.pause(),
      jump: (id) => typer.jump(id),
      mark: () => sweepPlayer.start(),
    };
    return () => {
      typer.stop();
      sweepPlayer.stop();
    };
  }, [beats]);

  const skipSweep = useRef(true);
  useEffect(() => {
    if (skipSweep.current) {
      skipSweep.current = false;
      return;
    }
    api.current?.mark();
  }, [beatId]);

  const beat = beats.find((item) => item.id === beatId) ?? beats[0];
  const lines = text.length > 0 ? text.split("\n") : [""];
  const status = playing ? "写入中" : done ? "已写完" : "待运行";

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] ring-0">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>组装这条请求</CardTitle>
          <Badge variant="secondary">{status}</Badge>
        </div>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              className={playClass}
              disabled={playing}
              onClick={() => {
                api.current?.play();
                api.current?.mark();
              }}
            >
              <Play />
              组装请求
            </Button>
            <Button variant="outline" disabled={!playing} onClick={() => api.current?.pause()}>
              <Pause />
              暂停
            </Button>
          </div>
          <SampleCode title="请求报文" value={beats.at(-1)?.text ?? text}>
            {lines.map((line, index) => (
              <CodeBlockLine
                key={`${index}-${line}`}
                variant={highlightLine(beatId, index, lines.length) ? "highlighted" : "default"}
              >
                {decorate(line, beatId, index)}
                {playing && index === lines.length - 1 ? "▌" : null}
              </CodeBlockLine>
            ))}
          </SampleCode>
          <div className="flex flex-wrap gap-2">
            {beats.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant="outline"
                data-active={item.id === beatId}
                className={tone[item.id]}
                onClick={() => api.current?.jump(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                data-testid="assemble-marker"
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                style={{ width: `${Math.round(sweep * 100)}%`, transition: "none" }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">标出：{beat.label}</p>
          </div>
        </div>
        <aside className="rounded-2xl border border-teal-100 border-l-4 border-l-teal-500 bg-teal-50/70 p-4" aria-live="polite">
          <p className="text-xs font-medium tracking-wide text-teal-700">这一段</p>
          <h3 className="mt-1 text-base font-semibold">{beat.label}</h3>
          <p className="mt-3 text-xs font-medium text-amber-700">它回答什么？</p>
          <p className="mt-1 text-sm leading-6">{beat.question}</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{beat.note}</p>
          <p className="mt-3 text-xs font-medium text-slate-500">样例里哪一段</p>
          <p className="mt-1 font-mono text-sm">{beat.sample}</p>
        </aside>
      </CardContent>
    </Card>
  );
}
