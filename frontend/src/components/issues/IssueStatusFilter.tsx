import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const statuses = [
  { id: "all", label: "All", color: "bg-muted" },
  { id: "pending", label: "Pending", color: "bg-warning" },
  { id: "in-progress", label: "In Progress", color: "bg-info" },
  { id: "resolved", label: "Resolved", color: "bg-success" },
  { id: "escalated", label: "Escalated", color: "bg-destructive" },
];

interface IssueStatusFilterProps {
  value: string;
  onChange: (status: string) => void;
}

export function IssueStatusFilter({ value, onChange }: IssueStatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <Button
          key={status.id}
          variant={value === status.id ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(status.id)}
          className={cn(
            "rounded-full gap-2",
            value !== status.id && "text-muted-foreground"
          )}
        >
          <span className={cn("w-2 h-2 rounded-full", status.color)} />
          {status.label}
        </Button>
      ))}
    </div>
  );
}
