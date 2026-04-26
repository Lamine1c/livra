import { Bell } from "lucide-react";
import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
}

export function Header({ title, subtitle, rightContent }: HeaderProps) {
  return (
    <header
      className="flex h-auto items-center justify-between gap-3 md:border-b md:border-gray-200 md:bg-white px-4 md:px-6 pb-3 md:pb-4"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        background: '#1a1b1f',
        boxShadow: 'inset 0 -0.5px 0 0 rgba(245,240,232,0.05)',
      }}
    >
      <div>
        <h1 className="text-base md:text-lg font-semibold text-[#F0EDE8] md:text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-[#8A8780] md:text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
      {rightContent !== undefined ? (
        rightContent
      ) : (
        <button
          className="md:rounded-lg md:p-2 md:text-gray-500 md:hover:bg-gray-100 md:transition-colors"
          style={{
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 12,
            background: '#1a1b1f',
            boxShadow: '-5px -5px 11px #212227, 5px 5px 11px #131417',
          }}
        >
          <Bell className="h-[18px] w-[18px]" style={{ color: 'rgba(245,240,232,0.85)' }} />
        </button>
      )}
    </header>
  );
}
