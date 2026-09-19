import { type ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/pages/home';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { Layout } from '@/components/layout';
import { StorefrontProvider } from '@/hooks/use-storefront';
import { HelmetProvider } from 'react-helmet-async';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { AdminShell } from '@/pages/admin';

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoImageUrl: `${window.location.origin}${basePath}/images/brand/kaya-wordmark.png`,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "hsl(146 65% 29%)", // --primary
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(90 33% 95%)",
    colorInputForeground: "hsl(146 50% 11%)",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border",
    card: "!shadow-none !border-0 !bg-transparent",
    footer: "!shadow-none !border-0 !bg-transparent",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground">Page not found</p>
    </div>
  );
}

import { Component } from 'react';

class ErrorBoundaryClass extends Component<{children: ReactNode, resetKey: any}, {hasError: boolean}> {
  constructor(props: {children: ReactNode, resetKey: any}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidUpdate(prevProps: {resetKey: any}) {
    if (prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground">Please refresh the page</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundaryClass resetKey={location}>{children}</ErrorBoundaryClass>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/admin`}
      signUpFallbackRedirectUrl={`${basePath}/admin`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/admin/*?" component={AdminShell} />
            <Route path="/">
              <StorefrontProvider>
                <Layout>
                  <Home />
                </Layout>
              </StorefrontProvider>
            </Route>
            <Route>
              <StorefrontProvider>
                <Layout>
                  <NotFound />
                </Layout>
              </StorefrontProvider>
            </Route>
          </Switch>
        </RoutedErrorBoundary>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <HelmetProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </HelmetProvider>
  );
}

export default App;
