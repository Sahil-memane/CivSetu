import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MapPin,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Building2,
  Loader2,
  KeyRound,
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [role, setRole] = useState<UserRole>("citizen"); // Kept for UI tab, though Firebase handles role via DB
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Phone Auth State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  const { loginWithEmail, loginWithPhone, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Clear OTP state when switching methods
    if (loginMethod === "email") {
      setOtpSent(false);
      setOtp("");
      setConfirmationResult(null);
    }
  }, [loginMethod]);

  const setupRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved
          },
        }
      );
    }
    return recaptchaVerifierRef.current;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithEmail(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Welcome back!", description: "Successfully logged in" });
      navigate(result.user?.role === "official" ? "/admin" : "/dashboard");
    } else {
      toast({
        title: "Login Failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpSent) {
      // Verify OTP
      if (!otp) {
        toast({
          title: "Error",
          description: "Please enter OTP",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      if (confirmationResult) {
        const result = await verifyOtp(confirmationResult, otp);
        if (result.success) {
          toast({
            title: "Welcome back!",
            description: "Successfully logged in",
          });
          // Redirect based on role if available (phone login currently defaults to citizen)
          navigate(result.user?.role === "official" ? "/admin" : "/dashboard");
        } else {
          toast({
            title: "Login Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      }
      setIsSubmitting(false);
    } else {
      // Send OTP
      if (!phone || phone.length < 10) {
        toast({
          title: "Error",
          description: "Please enter a valid phone number",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      const appVerifier = setupRecaptcha();
      const phoneNumber = `+91${phone}`; // Assuming India for now

      console.log("Attempting phone login with:", phoneNumber);
      const result = await loginWithPhone(phoneNumber, appVerifier);
      setIsSubmitting(false);

      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult);
        setOtpSent(true);
        toast({ title: "OTP Sent", description: "Please check your phone" });
      } else {
        let errorMsg = result.error || "Login failed";
        if (errorMsg.includes("billing-not-enabled")) {
          errorMsg =
            "Firebase Billing Error: Please use a Test Phone Number (e.g. +91 9999999999) configured in Firebase Console.";
        }

        toast({
          title: "Login Failed",
          description: errorMsg,
          variant: "destructive",
        });

        // Reset recaptcha
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        }
        // Force reload recaptcha container
        const container = document.getElementById("recaptcha-container");
        if (container) container.innerHTML = "";
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl hero-gradient flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">
                Welcome Back
              </h1>
              <p className="text-muted-foreground">
                Sign in to track your civic contributions
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-6">
              <Tabs
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
                className="mb-6"
              >
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
              </Tabs>

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

              {loginMethod === "email" ? (
                <form onSubmit={handleEmailLogin} className="space-y-4">
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
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
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
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    Sign In
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  {!otpSent ? (
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
                  ) : (
                    <div>
                      <Label htmlFor="otp">Enter OTP</Label>
                      <div className="relative mt-1.5">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="otp"
                          type="text"
                          placeholder="123456"
                          className="h-12 pl-10"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div id="recaptcha-container"></div>

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : otpSent ? (
                      "Verify OTP"
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </form>
              )}

              <p className="text-center mt-6 text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-primary font-medium hover:underline"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
