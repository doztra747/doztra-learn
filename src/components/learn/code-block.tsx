import { faCode } from "@fortawesome/free-solid-svg-icons";

import { Icon } from "@/components/icon";
import { CopyButton } from "@/components/learn/copy-button";
import type { CodeToken } from "@/server/demo/data";

type Props = {
  lines: CodeToken[][];
  filename?: string;
  language?: string;
  highlightLines?: number[];
  showLineNumbers?: boolean;
};

/**
 * Bloc de code (F-33), gabarit du prototype. Couleurs par classes dzl-tok-* (pas de style inline, CSP).
 * Phase 4 : les jetons viendront du rendu Shiki côté serveur, stocké dans content_html.
 */
export function CodeBlock({ lines, filename, language, highlightLines = [], showLineNumbers = true }: Props) {
  const source = lines.map((line) => line.map((t) => t.text).join("")).join("\n");
  return (
    <div className="overflow-hidden rounded-lg bg-code-bg">
      {filename || language ? (
        <div className="flex items-center gap-2.5 bg-forest px-3.5 py-2.5 text-[13px] text-[#C9D8D4]">
          <Icon icon={faCode} className="shrink-0" />
          {filename ? <span className="min-w-0 truncate font-mono">{filename}</span> : null}
          {language ? <span className="shrink-0 rounded-[6px] bg-gold/18 px-2 py-[3px] text-[11px] font-bold text-gold">{language}</span> : null}
          <CopyButton text={source} />
        </div>
      ) : null}
      <pre className="overflow-x-auto py-3 font-mono text-sm leading-[1.75]" tabIndex={0} aria-label={filename ? `Code : ${filename}` : "Bloc de code"}>
        <code className="block min-w-max">
          {lines.map((line, i) => {
            const highlighted = highlightLines.includes(i + 1);
            return (
              <span key={i} className={`flex border-l-[3px] pr-4 ${highlighted ? "dzl-line-highlight" : "border-transparent"}`}>
                {showLineNumbers ? (
                  <span className="w-11 shrink-0 pr-4 text-right text-[#4F6C67] select-none" aria-hidden="true">
                    {i + 1}
                  </span>
                ) : null}
                <span className="whitespace-pre">
                  {line.length === 0 ? " " : line.map((token, j) => <span key={j} className={`dzl-tok-${token.kind}`}>{token.text}</span>)}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
