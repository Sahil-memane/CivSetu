import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "All Issues", icon: "📋" },
  { id: "pothole", label: "Potholes", icon: "🕳️" },
  { id: "water", label: "Water", icon: "💧" },
  { id: "garbage", label: "Garbage", icon: "🗑️" },
  { id: "streetlight", label: "Street Lights", icon: "💡" },
  { id: "drainage", label: "Drainage", icon: "🚰" },
  { id: "road", label: "Roads", icon: "🛣️" },
  { id: "other", label: "Other", icon: "📌" },
];

interface IssueCategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export function IssueCategoryFilter({ selected, onChange }: IssueCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            selected === category.id
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <span>{category.icon}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
}
