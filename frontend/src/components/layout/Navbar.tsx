import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
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
                      <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                          <AlertTriangle className="w-16 h-16 text-destructive" />
                        </div>
                        <div className="flex items-center gap-2 text-destructive mb-2 relative z-10">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-semibold text-sm">
                            SLA Breach Alert
                          </span>
                        </div>
                        <p className="text-sm text-foreground relative z-10">
                          <strong>5 issues</strong> are approaching their SLA
                          deadline. Immediate action is required.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                        >
                          View At-Risk Issues
                        </Button>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span className="font-medium text-sm">
                            System Update
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Dashboard metrics updated successfully.
                        </p>
                      </div>
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
