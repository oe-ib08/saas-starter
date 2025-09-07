"use client";

import Logo from "@/components/navbar-components/logo"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from "next/link"
import { Home, LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { User, TeamDataWithMembers } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { PlanBadge } from '@/components/ui/plan-badge';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Navigation links array to be used in both desktop and mobile menus
const navigationLinks = [
  { href: "/", label: "Home", active: true },
  { href: "#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "#about", label: "About" },
]

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    try {
      // Use better-auth signOut
      await authClient.signOut();
      mutate('/api/user');
      mutate('/api/team');
      router.push('/sign-in');
    } catch (error) {
      console.error('Sign out failed:', error);
      // Force redirect even if sign out fails
      window.location.href = '/sign-in';
    }
  }

  if (!user) {
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="text-sm">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button asChild size="sm" className="text-sm">
          <Link href="/sign-up">Get Started</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <div className="relative">
          <Avatar className="cursor-pointer size-9">
            <AvatarImage src={user.image || ''} alt={user.name || ''} />
            <AvatarFallback>
              {user.name
                ? user.name.split(' ').map((n) => n[0]).join('')
                : user.email.split('@')[0].substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <PlanBadge planName={team?.planName} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="w-full cursor-pointer"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header() {
  return (
    <header className="border-b px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {/* Mobile menu trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group size-8 md:hidden"
                variant="ghost"
                size="icon"
              >
                <svg
                  className="pointer-events-none"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12L20 12"
                    className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-36 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                  {navigationLinks.map((link, index) => (
                    <NavigationMenuItem key={index} className="w-full">
                      <NavigationMenuLink
                        href={link.href}
                        className="py-1.5"
                        active={link.active}
                      >
                        {link.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>
          {/* Main nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-primary hover:text-primary/90">
              <Logo />
            </Link>
            {/* Navigation menu */}
            <NavigationMenu className="max-md:hidden">
              <NavigationMenuList className="gap-2">
                {navigationLinks.map((link, index) => (
                  <NavigationMenuItem key={index}>
                    <NavigationMenuLink
                      active={link.active}
                      href={link.href}
                      className="text-muted-foreground hover:text-primary py-1.5 font-medium"
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        {/* Right side */}
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
