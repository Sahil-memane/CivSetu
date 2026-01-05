import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, User, Building2, Loader2 } from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [role, setRole] = useState<UserRole>("citizen");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const identifier = loginMethod === "email" ? email : `+91${phone}`;
    
    if (!identifier || !password) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all fields", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const result = await login(identifier, password, role);
    
    setIsSubmitting(false);
    
    if (result.success) {
      toast({ title: "Welcome back!", description: "You have successfully logged in" });
      navigate(role === "official" ? "/admin" : "/dashboard");
    } else {
      toast({ title: "Login Failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl hero-gradient flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">
                Sign in to track your civic contributions
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-card rounded-2xl border border-border/50 p-6">
              <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)} className="mb-6">
                <TabsList className="w-full">
                  <TabsTrigger value="citizen" className="flex-1 gap-2">
                    <User className="w-4 h-4" />
                    Citizen
                  </TabsTrigger>
                  <TabsTrigger value="official" className="flex-1 gap-2">
                    <Building2 className="w-4 h-4" />
                    Official
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="citizen" className="mt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Access your dashboard and track reported issues
                  </p>
                </TabsContent>
                <TabsContent value="official" className="mt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Access the admin panel to manage civic issues
                  </p>
                </TabsContent>
              </Tabs>

              {/* Login Method Toggle */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={loginMethod === "email" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setLoginMethod("email")}
                  type="button"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant={loginMethod === "phone" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setLoginMethod("phone")}
                  type="button"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {loginMethod === "email" ? (
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="mt-1.5 h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        value="+91"
                        disabled
                        className="w-16 h-12 text-center"
                      />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        className="flex-1 h-12"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button variant="hero" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11" type="button">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="h-11" type="button">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  Facebook
                </Button>
              </div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center mt-6 text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
