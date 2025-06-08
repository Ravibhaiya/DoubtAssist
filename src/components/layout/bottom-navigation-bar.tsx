"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/ask', label: 'Ask Doubt', icon: MessageSquarePlus },
];

export function BottomNavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-t-md flex sm:hidden z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center text-xs gap-1 transition-colors duration-150 ease-in-out transform active:scale-95',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : '')} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
