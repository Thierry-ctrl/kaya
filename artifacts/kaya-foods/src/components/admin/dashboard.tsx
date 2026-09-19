import { useGetAdminSettings, useGetAdminProducts } from "@workspace/api-client-react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function AdminDashboard() {
  const { data: settings, isPending: loadingSettings } = useGetAdminSettings();
  const { data: products, isPending: loadingProducts } = useGetAdminProducts();

  if (loadingSettings || loadingProducts) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-primary">Dashboard</h1>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!settings || !products) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Failed to load dashboard</h2>
      </div>
    );
  }

  // Calculate checklist
  const hasContactInfo = !!(settings.whatsappNumber && settings.contactEmail);
  const hasDelivery = !!(settings.deliveryAreas && settings.deliveryFee);
  const hasPayment = !!settings.paymentMethods;
  const hasProducts = products.length > 0;
  
  // A published non-sample product must exist to actually order something
  const hasLiveProducts = products.some(p => p.published && !p.isSample && p.availability === 'available' && p.sizes.length > 0);
  
  // Has samples
  const sampleProducts = products.filter(p => p.isSample);
  const liveSamplesCount = sampleProducts.filter(p => p.published && p.availability === 'available' && p.sizes.length > 0).length;

  const steps = [
    { label: "Configure Contact Information", done: hasContactInfo, desc: "Add WhatsApp and Email so customers can reach you", link: "/admin/settings" },
    { label: "Set Delivery Details", done: hasDelivery, desc: "Define where you deliver and how much it costs", link: "/admin/settings" },
    { label: "Set Payment Methods", done: hasPayment, desc: "Tell customers how they can pay (MoMo, Cash, etc)", link: "/admin/settings" },
    { label: "Add Products", done: hasProducts, desc: "Create at least one product in your catalogue", link: "/admin/products" },
    { label: "Publish a Live Product", done: hasLiveProducts, desc: "Publish a non-sample product with sizes and prices to accept real orders", link: "/admin/products" }
  ];

  const progress = Math.round((steps.filter(s => s.done).length / steps.length) * 100);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-primary">Welcome to Kaya Admin</h1>
        <p className="text-muted-foreground mt-2 text-lg">Manage your shop, update your catalogue, and configure your storefront.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-border md:col-span-2">
          <CardHeader className="bg-primary/5 border-b border-border">
            <CardTitle className="flex justify-between items-center text-primary">
              <span>Launch Checklist</span>
              <span className="text-xl">{progress}%</span>
            </CardTitle>
            <CardDescription>Complete these steps to make sure your shop is ready for customers.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {steps.map((step, i) => (
                <div key={i} className={`p-4 md:px-6 flex items-start gap-4 transition-colors ${step.done ? "bg-muted/20" : ""}`}>
                  <div className="mt-1">
                    {step.done ? (
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {step.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                  </div>
                  {!step.done && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={step.link}>Go</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Product Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                <span className="font-medium text-foreground">Total Products</span>
                <span className="text-xl font-bold">{products.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/5 text-primary rounded-xl">
                <span className="font-medium">Published & Live</span>
                <span className="text-xl font-bold">{products.filter(p => p.published).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Sample Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-accent/20 rounded-xl border border-accent/40 text-accent-foreground text-sm">
              <p className="font-semibold mb-2">Sample Caveats:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Samples show zero price (Free).</li>
                <li>They appear in a dedicated Sample category.</li>
                <li>You have {liveSamplesCount} live sample(s).</li>
                <li>A live shop should ideally limit sample availability or require minimum purchase (handled outside this system).</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}