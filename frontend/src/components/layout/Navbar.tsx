import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoogleTranslate } from "@/components/common/GoogleTranslate";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  MapPin,
  FileText,
  LayoutDashboard,
  Shield,
  Bell,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Issue Map", icon: MapPin },
  { href: "/report", label: "Report Issue", icon: FileText },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [googleOffset, setGoogleOffset] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Notification Listener
  useEffect(() => {
    // Check for user ID (supporting both uid and id properties if typo in type)
    const userId = (user as any)?.uid || (user as any)?.id;
    if (!userId) return;

    const q = query(
      collection(db, "users", userId, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // Monitor Google Translate banner adding 'top' to body
    const updateOffset = () => {
      const topVal = parseInt(document.body.style.top || "0", 10);
      setGoogleOffset(isNaN(topVal) ? 0 : topVal);
    };

    // Observer to watch body style attribute
    const observer = new MutationObserver(updateOffset);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Initial check
    updateOffset();

    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav
      className="fixed left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 transition-[top] duration-300 ease-in-out"
      style={{ top: `${googleOffset}px` }}
    >
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 z-20">
            <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center shadow-md">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Civ<span className="text-primary">Setu</span>
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link
              to="/"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === "/"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Home
            </Link>

            {(isAuthenticated || true) && (
              <>
                <Link
                  to="/map"
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === "/map"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  Issue Map
                </Link>
                {/* Hide Report Issue link from nav for admins if preferred, or keep it. User asked to hiding button specifically. */}
                {user?.role !== "official" && (
                  <Link
                    to="/report"
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      location.pathname === "/report"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    Report Issue
                  </Link>
                )}
              </>
            )}

            {isAuthenticated && user?.role === "citizen" && (
              <Link
                to="/dashboard"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === "/dashboard"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Dashboard
              </Link>
            )}

            {isAuthenticated && user?.role === "official" && (
              <Link
                to="/admin"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === "/admin"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Admin Dashboard
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4 z-20">
            <GoogleTranslate />
            {!isAuthenticated ? (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/report">
                  <Button variant="hero" size="sm">
                    Report Issue
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Rich User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-auto flex items-center gap-2 px-2 hover:bg-muted/50"
                    >
                      <span className="text-sm font-semibold text-foreground hidden lg:inline-block">
                        {user?.name || "User"}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                        {user?.name?.[0].toUpperCase() || "U"}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      {user?.department && (
                        <div className="mb-2">
                          <Badge
                            variant="outline"
                            className="w-full text-center justify-center border-primary/30 text-primary bg-primary/5"
                          >
                            {user.department}
                          </Badge>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground capitalize text-center mb-1">
                        Role: {user?.role}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Notification Sheet - Now on the Right */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative text-muted-foreground hover:text-foreground"
                    >
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Notifications</SheetTitle>
                      <SheetDescription>
                        Real-time alerts and system updates.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {notifications.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif: any) => (
                          <div key={notif.id} className={cn(
                            "p-4 rounded-xl border relative overflow-hidden transition-all",
                            notif.type === 'SLA_BREACH' ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-border/50"
                          )}>
                            {notif.type === 'SLA_BREACH' && (
                              <div className="absolute top-0 right-0 p-2 opacity-10">
                                <AlertTriangle className="w-16 h-16 text-destructive" />
                              </div>
                            )}

                            <div className="flex items-center gap-2 mb-1 relative z-10">
                              {notif.type === 'SLA_BREACH' ? (
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                              ) : notif.type === 'RESOLUTION' ? (
                                <CheckCircle2 className="w-4 h-4 text-success" />
                              ) : (
                                <Bell className="w-4 h-4 text-primary" />
                              )}
                              <span className={cn("font-semibold text-sm",
                                notif.type === 'SLA_BREACH' ? "text-destructive" : "text-foreground"
                              )}>
                                {notif.title}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground relative z-10">
                              {notif.body}
                            </p>
                            <p className="text-[10px] text-muted-foreground/50 mt-2 text-right">
                              {new Date(notif.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>

                {user?.role !== "official" && (
                  <Link to="/report">
                    <Button variant="hero" size="sm" className="ml-2">
                      Report Issue
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors z-20"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in relative z-10 bg-background/95 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Home
              </Link>
              <Link
                to="/map"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <MapPin className="w-4 h-4" />
                Issue Map
              </Link>

              {isAuthenticated && user?.role === "citizen" && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}

              {isAuthenticated && user?.role === "official" && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              )}

              <hr className="my-2 border-border" />

              {!isAuthenticated ? (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/report" onClick={() => setIsOpen(false)}>
                    <Button variant="hero" className="w-full">
                      Report Issue
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                >
                  Logout
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
