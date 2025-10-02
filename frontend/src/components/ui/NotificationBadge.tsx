interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className = '' }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <span
      className={`
        absolute -top-1 -right-1 
        min-w-[18px] h-[18px] 
        flex items-center justify-center
        bg-red-500 text-white 
        text-[10px] font-bold 
        rounded-full 
        px-1
        shadow-sm
        ${className}
      `}
      aria-label={`${count} notification${count !== 1 ? 's' : ''}`}
    >
      {displayCount}
    </span>
  );
}

