import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ChannelMetric = {
  value: string;
  quantity: string;
  cpa: string;
};

export type MarketingChannelRow = {
  stage: string;
  meta: ChannelMetric;
  google: ChannelMetric;
};

const channelGroups = [
  { key: "meta", label: "Meta", tint: "bg-[var(--palette-pink)]/14" },
  { key: "google", label: "Google", tint: "bg-[var(--palette-blue)]/14" },
] as const;

const metricHeaders = ["Valor", "QTD", "CPA"];

export function MarketingChannelTable({
  rows,
}: {
  rows: MarketingChannelRow[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-panel)]">
      <Table className="min-w-[820px] border-separate border-spacing-0">
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="w-[140px] border-r border-white/10 bg-[var(--surface-panel-strong)] px-4 py-3" />
          {channelGroups.map((group) => (
            <TableHead
              key={group.key}
              className={cn(
                "border-b border-white/10 px-4 py-4 text-center text-sm font-semibold text-foreground",
                group.tint,
              )}
              colSpan={3}
            >
              {group.label}
            </TableHead>
          ))}
        </TableRow>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="w-[140px] border-r border-white/10 bg-[var(--surface-panel-strong)] px-4 py-3" />
          {channelGroups.map((group) =>
            metricHeaders.map((header, index) => (
              <TableHead
                key={`${group.key}-${header}`}
                className={cn(
                  "border-b border-white/10 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
                  group.tint,
                  index === 2 && group.key === "meta" && "border-r border-white/10",
                )}
              >
                {header}
              </TableHead>
            )),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow
            key={row.stage}
            className={cn(
              "border-white/10 text-foreground hover:bg-white/5",
              rowIndex % 2 === 0 ? "bg-white/[0.03]" : "bg-white/[0.06]",
            )}
          >
            <TableCell className="border-r border-white/10 bg-[var(--surface-panel-strong)] px-4 py-4 font-semibold">
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--palette-yellow)]" />
                {row.stage}
              </span>
            </TableCell>
            {channelGroups.map((group) => {
              const metric = row[group.key];
              const values = [metric.value, metric.quantity, metric.cpa];

              return values.map((value, index) => (
                <TableCell
                  key={`${group.key}-${row.stage}-${index}`}
                  className={cn(
                    "px-4 py-4 text-center text-sm tabular-nums",
                    index === 2 && "font-semibold",
                    index === 2 && group.key === "meta" && "border-r border-white/10",
                  )}
                >
                  {index === 2 ? (
                    <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[var(--palette-yellow)] shadow-sm">
                      {value}
                    </span>
                  ) : (
                    value
                  )}
                </TableCell>
              ));
            })}
          </TableRow>
        ))}
      </TableBody>
      </Table>
    </div>
  );
}
