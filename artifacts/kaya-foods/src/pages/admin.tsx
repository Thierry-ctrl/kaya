import { useEffect } from 'react';
import { useAuth, useClerk } from "@clerk/react";
import { useGetAdminMe, getGetAdminMeQueryKey } from "@workspace/api-client-react";
import { Switch, Route, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ProductsAdmin } from "@/components/admin/products";
import { SettingsAdmin } from "@/components/admin/settings";
import { AdminDashboard } from "@/components/admin/dashboard";
import { 
  Store, 
  LayoutDashboard, 
  Package, 
  Settings, 
  LogOut,
  ShieldAlert
} from "lucide-react";
import { Helmet } from "react-helmet-async";

export function AdminShell() {
  const { isLoaded, userId } = useAuth();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const { data: me, error, isPending, refetch } = useGetAdminMe({ query: { enabled: !!userId, queryKey: getGetAdminMeQueryKey(), retry: false } });

  useEffect(() => {
    if (isLoaded && !userId) {
      setLocation('/sign-in');
    }
  }, [isLoaded, userId, setLocation]);

  if (!isLoaded || (userId && isPending)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading Admin...</p>
        </div>
      </div>
    );
  }

  if (userId && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-3xl border border-destructive/20 bg-card p-8 text-center shadow-xl">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-black text-foreground mb-2">{error.status === 403 ? "Access Denied" : "Unable to verify access"}</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            {error.status === 403 ? <>You are logged in with Clerk user ID <code className="bg-muted px-1.5 py-0.5 rounded text-xs break-all">{userId}</code>, but administrator access has not been granted. Contact the administrator to grant your account access.</> : "The access check failed. Please retry, or sign in again if your session has expired."}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => void refetch()} className="w-full">Check access again</Button>
            <Button onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })} variant="outline" className="w-full">
              Sign out
            </Button>
            <Button asChild className="w-full">
              <Link href="/">Return to Storefront</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!userId || !me) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 font-sans md:h-screen md:flex-row md:overflow-hidden">
      <Helmet>
        <title>Admin | Kaya Foods</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      {/* Sidebar */}
      <aside className="w-full flex-shrink-0 bg-card border-b border-border flex flex-col z-20 md:w-64 md:border-b-0 md:border-r">
        <div className="h-16 flex items-center px-6 border-b border-border bg-background/50">
          <img src={`${import.meta.env.BASE_URL}images/brand/kaya-wordmark.png`} alt="Kaya Foods" className="h-8 object-contain" />
          <span className="ml-3 font-black text-sm tracking-widest text-primary uppercase">Admin</span>
        </div>
        
        <nav className="flex flex-row gap-1 px-3 py-3 md:flex-1 md:flex-col md:overflow-y-auto md:py-4">
          <NavLink href="/admin" icon={LayoutDashboard} exact>Dashboard</NavLink>
          <NavLink href="/admin/products" icon={Package}>Products</NavLink>
          <NavLink href="/admin/settings" icon={Settings}>Settings</NavLink>
        </nav>
        
        <div className="p-3 border-t border-border bg-background/50 flex flex-row gap-2 md:flex-col md:p-4">
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" asChild>
            <Link href="/">
              <Store className="w-4 h-4 mr-2" />
              Open Shop
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 relative bg-background md:overflow-y-auto">
          <Switch>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/products" component={ProductsAdmin} />
            <Route path="/admin/settings" component={SettingsAdmin} />
          </Switch>
      </main>
    </div>
  );
}

function NavLink({ href, icon: Icon, children, exact = false }: { href: string, icon: any, children: React.ReactNode, exact?: boolean }) {
  const [location] = useLocation();
  const isActive = exact ? location === href : location.startsWith(href);
  
  return (
    <Link href={href}>
      <span className={`
        flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors
        ${isActive 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }
      `}>
        <Icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-70"}`} />
        {children}
      </span>
    </Link>
  );
}
