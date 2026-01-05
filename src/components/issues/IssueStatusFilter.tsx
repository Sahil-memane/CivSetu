import { cn } from "@/lib/utils";

const statuses = [
  { id: "all", label: "All", color: "bg-muted" },
  { id: "pending", label: "Pending", color: "bg-warning" },
  { id: "in-progress", label: "In Progress", color: "bg-info" },
  { id: "resolved", label: "Resolved", color: "bg-success" },
  { id: "escalated", label: "Escalated", color: "bg-destructive" },
];

interface IssueStatusFilterProps {
  selected: string;
  onChange: (status: string) => void;
}

export function IssueStatusFilter({ selected, onChange }: IssueStatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status.id}
          onClick={() => onChange(status.id)}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            selected === status.id
              ? "bg-foreground text-background shadow-md"
              : "bg-card border border-border text-foreground hover:border-foreground/30"
          )}
        >
          <span className={cn("w-2 h-2 rounded-full", status.color)} />
          <span>{status.label}</span>
        </button>
      ))}
    </div>
  );
}
