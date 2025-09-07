import { cn } from "@/lib/utils";

interface PlanBadgeProps {
  planName?: string | null;
  className?: string;
}

export function PlanBadge({ planName, className }: PlanBadgeProps) {
  // Show "Free" as default if no plan is set
  const displayPlan = planName || 'Free';

  // Determine badge color based on plan name
  const getBadgeColor = (plan: string) => {
    const planLower = plan.toLowerCase();
    if (planLower.includes('pro') || planLower.includes('premium')) {
      return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    } else if (planLower.includes('plus') || planLower.includes('standard')) {
      return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    } else if (planLower.includes('basic') || planLower.includes('starter')) {
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
    } else if (planLower.includes('free')) {
      return 'bg-gray-500 text-white';
    }
    return 'bg-orange-500 text-white';
  };

  return (
    <div
      className={cn(
        "absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-xs font-medium shadow-lg border-2 border-white",
        getBadgeColor(displayPlan),
        className
      )}
    >
      {displayPlan}
    </div>
  );
}
