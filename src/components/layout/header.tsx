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
      className="dashboard-header flex min-h-14 md:min-h-16 items-end justify-between border-b border-[#252525] md:border-gray-200 bg-[#0D0D0D] md:bg-white px-4 md:px-6 pb-3 md:pb-4"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
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
        <button className="rounded-lg p-2 text-[#8A8780] md:text-gray-500 hover:bg-[#1e1e20] md:hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
      )}
    </header>
  );
}
