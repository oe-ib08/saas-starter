"use client";

import Logo from "@/components/navbar-components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Home, LogOut, Search, ArrowRight, Sparkles } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { User, TeamDataWithMembers } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { useState, useId, useEffect } from 'react';
import { PlanBadge } from '@/components/ui/plan-badge';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // For auth-related endpoints, don't throw an error if unauthorized
    if (res.status === 401 || res.status === 403) {
      return null;
    }
    // For other errors, still return null to prevent crashes
    console.warn(`API call to ${url} failed with status ${res.status}`);
    return null;
  }
  return res.json();
};

// Navigation links array to be used in both desktop and mobile menus
const navigationLinks = [
  { href: "/", label: "Home", active: true },
  { href: "#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "#about", label: "About" },
]

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const { data: user, isLoading, error } = useSWR<User>('/api/user', fetcher);
  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const router = useRouter();

  // Set a timeout to show fallback buttons if loading takes too long
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setShowFallback(true);
      }, 2000); // Show fallback after 2 seconds

      return () => clearTimeout(timeout);
    } else {
      setShowFallback(false);
    }
  }, [isLoading]);

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

  // Show loading state during sign out transition, but not indefinitely
  if (isLoading && !error && !showFallback) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse rounded-full h-9 w-9 bg-muted"></div>
      </div>
    );
  }

  // Show sign in/get started buttons if user is not authenticated, if there's an auth error, or if loading is taking too long
  if (!user || error || showFallback) {
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
    <div className="flex items-center gap-2">
      <UpgradeButton planName={team?.planName} />
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger>
          <div className="relative">
            <Avatar className="cursor-pointer size-9">
              <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
              <AvatarFallback>
                {user?.name
                  ? user.name.split(' ').map((n) => n[0]).join('')
                  : user?.email ? user.email.split('@')[0].substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <PlanBadge planName={team?.planName} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="flex flex-col gap-1">
          <DropdownMenuItem className="cursor-pointer">
            <Link href="/profile" className="flex w-full items-center">
              <Home className="mr-2 h-4 w-4" />
              <span>Profile</span>
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
    </div>
  );
}

function SearchComponent() {
  const id = useId();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // You can implement search functionality here
      console.log('Searching for:', searchQuery);
      // For now, we'll just log the search query
      // You could navigate to a search results page or trigger a search
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <Input
        id={id}
        className="peer ps-9 pe-9 w-64 max-md:w-48"
        placeholder="Search..."
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
        <Search size={16} />
      </div>
      <button
        className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Submit search"
        type="submit"
      >
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </form>
  );
}

function UpgradeButton({ planName }: { planName?: string | null }) {
  // Only show for free users
  if (!planName || planName.toLowerCase() !== 'free') {
    return null;
  }

  return (
    <Button 
      size="sm" 
      className="text-sm bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0"
      asChild
    >
      <Link href="/pricing">
        <Sparkles
          className="opacity-80 sm:-ms-1"
          size={16}
          aria-hidden="true"
        />
        <span className="max-sm:sr-only">Upgrade</span>
      </Link>
    </Button>
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
            <PopoverContent align="start" className="w-80 p-4 md:hidden">
              <div className="space-y-4">
                {/* Mobile search */}
                <SearchComponent />
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
              </div>
            </PopoverContent>
          </Popover>
          {/* Main nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-primary hover:text-primary/90">
              <Logo />
            </Link>
            {/* Navigation menu and search */}
            <div className="flex items-center gap-4">
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
              {/* Search component beside nav buttons */}
              <div className="hidden md:block">
                <SearchComponent />
              </div>
            </div>
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
