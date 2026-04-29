import React from "react";

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let n = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const k = `${keyPrefix}-${n++}`;
    if (match[1]) {
      nodes.push(<strong key={k}>{match[2]}</strong>);
    } else if (match[3]) {
      nodes.push(<em key={k}>{match[4]}</em>);
    } else if (match[5]) {
      nodes.push(
        <code
          key={k}
          className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-primary-700"
        >
          {match[6]}
        </code>
      );
    } else if (match[7]) {
      nodes.push(
        <a
          key={k}
          href={match[9]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 underline hover:text-primary-700"
        >
          {match[8]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function parseTableRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-6 border-gray-200" />);
      i++;
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const id = `h-${key}`;
      const inline = renderInline(text, id);
      if (level === 1) {
        blocks.push(
          <h1
            key={key++}
            className="mb-3 mt-2 text-xl font-bold text-primary-900"
          >
            {inline}
          </h1>
        );
      } else if (level === 2) {
        blocks.push(
          <h2
            key={key++}
            className="mb-2 mt-5 text-lg font-bold text-primary-800"
          >
            {inline}
          </h2>
        );
      } else if (level === 3) {
        blocks.push(
          <h3
            key={key++}
            className="mb-2 mt-4 text-base font-semibold text-primary-700"
          >
            {inline}
          </h3>
        );
      } else {
        blocks.push(
          <h4
            key={key++}
            className="mb-1 mt-3 text-sm font-semibold text-primary-700"
          >
            {inline}
          </h4>
        );
      }
      i++;
      continue;
    }

    if (line.trim().startsWith("|") && /\|/.test(lines[i + 1] || "")) {
      const headers = parseTableRow(line.trim());
      const sep = lines[i + 1].trim();
      if (/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(sep)) {
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          rows.push(parseTableRow(lines[i].trim()));
          i++;
        }
        blocks.push(
          <div
            key={key++}
            className="my-3 overflow-x-auto rounded-lg border border-gray-200"
          >
            <table className="w-full text-sm">
              <thead className="bg-primary-50">
                <tr>
                  {headers.map((h, idx) => (
                    <th
                      key={idx}
                      className="px-3 py-2 text-start font-semibold text-primary-700"
                    >
                      {renderInline(h, `th-${key}-${idx}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-t border-gray-100">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3 py-2 align-top text-gray-700"
                      >
                        {renderInline(cell, `td-${key}-${rIdx}-${cIdx}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    if (line.trim().startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        buf.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-3 border-s-4 border-accent-400 bg-warm-50 px-4 py-2 text-sm text-gray-700"
        >
          {renderInline(buf.join(" "), `bq-${key}`)}
        </blockquote>
      );
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ""));
        i++;
      }
      blocks.push(
        <ul
          key={key++}
          className="my-2 list-disc space-y-1 ps-6 text-sm text-gray-700"
        >
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `li-${key}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol
          key={key++}
          className="my-2 list-decimal space-y-1 ps-6 text-sm text-gray-700"
        >
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `oli-${key}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|---+$|>\s|\s*-\s|\s*\d+\.\s|\|)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-2 text-sm leading-relaxed text-gray-700">
        {renderInline(paraLines.join(" "), `p-${key}`)}
      </p>
    );
  }

  return <div>{blocks}</div>;
}
