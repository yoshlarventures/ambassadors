"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, AlertCircle, Mail, Phone, MessageCircle, Search, UserPlus, Unlink, RefreshCw } from "lucide-react";
import { User } from "@/types";
import { SearchByType } from "@/lib/exode/types";
import { cn } from "@/lib/utils";
import { useLearningControls } from "./learning-controls-context";

interface LearningPageProps {
  user: User;
}

type LinkStatus = "idle" | "searching" | "not_found" | "found" | "creating" | "success" | "error";
type AuthStatus = "idle" | "loading" | "success" | "error";

export function LearningPage({ user }: LearningPageProps) {
  const [isLinked, setIsLinked] = useState(!!user.exode_user_id);
  const [selectedIdentifier, setSelectedIdentifier] = useState<SearchByType>("email");
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("idle");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<string | null>(null);

  // Manual input values
  const [manualPhone, setManualPhone] = useState(user.phone || "");
  const [manualTelegram, setManualTelegram] = useState("");

  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isUnlinking, setIsUnlinking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { setControls } = useLearningControls();

  // Define callbacks first (before useEffects that use them)
  const fetchAuthToken = useCallback(async () => {
    setAuthStatus("loading");
    setAuthError(null);

    try {
      const response = await fetch("/api/exode/auth-token", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresLink) {
          setIsLinked(false);
          return;
        }
        throw new Error(data.error || "Failed to get auth token");
      }

      setIframeUrl(data.iframeUrl);
      setAuthStatus("success");
    } catch (error) {
      console.error("Error fetching auth token:", error);
      setAuthError(error instanceof Error ? error.message : "Failed to load learning platform");
      setAuthStatus("error");
    }
  }, []);

  const handleUnlink = useCallback(async () => {
    if (!confirm("Are you sure you want to unlink your Exode account? You'll need to re-link it to access the learning platform.")) {
      return;
    }

    setIsUnlinking(true);

    try {
      const response = await fetch("/api/exode/unlink-account", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unlink account");
      }

      // Reset state
      setIsLinked(false);
      setIframeUrl(null);
      setAuthStatus("idle");
    } catch (error) {
      console.error("Error unlinking account:", error);
      alert(error instanceof Error ? error.message : "Failed to unlink account");
    } finally {
      setIsUnlinking(false);
    }
  }, []);

  const handleRefreshIframe = useCallback(() => {
    if (iframeRef.current && iframeUrl) {
      setIframeLoading(true);
      iframeRef.current.src = iframeUrl;
    }
  }, [iframeUrl]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Fetch auth token when component mounts and account is linked
  useEffect(() => {
    if (isLinked) {
      fetchAuthToken();
    }
  }, [isLinked, fetchAuthToken]);

  // Set/clear controls in context
  useEffect(() => {
    if (authStatus === "success" && iframeUrl) {
      setControls({
        iframeUrl,
        isLoading: iframeLoading,
        isFullscreen,
        onRefresh: handleRefreshIframe,
        onToggleFullscreen: toggleFullscreen,
        onUnlink: handleUnlink,
        onOpenNewTab: () => window.open(iframeUrl, "_blank"),
      });
    } else {
      setControls(null);
    }

    // Cleanup on unmount
    return () => setControls(null);
  }, [authStatus, iframeUrl, iframeLoading, isFullscreen, setControls, handleRefreshIframe, toggleFullscreen, handleUnlink]);

  const getSearchValue = (): string | null => {
    switch (selectedIdentifier) {
      case "email":
        return user.email;
      case "phone":
        return user.phone || manualPhone || null;
      case "telegram":
        return manualTelegram || null;
      default:
        return null;
    }
  };

  const handleSearch = async () => {
    const value = getSearchValue();
    if (!value) return;

    setLinkStatus("searching");
    setLinkError(null);
    setSearchResult(null);

    try {
      const response = await fetch("/api/exode/link-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchBy: selectedIdentifier,
          value: selectedIdentifier !== "email" ? value : undefined,
          searchOnly: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.notFound) {
          setLinkStatus("not_found");
          setSearchResult(`No account found with this ${selectedIdentifier}. Try another method or create a new account.`);
          return;
        }
        throw new Error(data.error || "Failed to search account");
      }

      // Account found and linked
      setLinkStatus("success");
      setIsLinked(true);
    } catch (error) {
      console.error("Error searching account:", error);
      setLinkError(error instanceof Error ? error.message : "Failed to search account");
      setLinkStatus("error");
    }
  };

  const handleCreateAccount = async () => {
    setLinkStatus("creating");
    setLinkError(null);

    try {
      const response = await fetch("/api/exode/link-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchBy: selectedIdentifier,
          value: selectedIdentifier !== "email" ? getSearchValue() : undefined,
          createIfNotFound: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setLinkStatus("success");
      setIsLinked(true);
    } catch (error) {
      console.error("Error creating account:", error);
      setLinkError(error instanceof Error ? error.message : "Failed to create account");
      setLinkStatus("error");
    }
  };

  const resetSearch = () => {
    setLinkStatus("idle");
    setLinkError(null);
    setSearchResult(null);
  };

  const identifierOptions: {
    type: SearchByType;
    label: string;
    icon: React.ReactNode;
    hasValue: boolean;
    showInput: boolean;
  }[] = [
    {
      type: "email",
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
      hasValue: !!user.email,
      showInput: false,
    },
    {
      type: "phone",
      label: "Phone",
      icon: <Phone className="h-4 w-4" />,
      hasValue: !!manualPhone || !!user.phone,
      showInput: !user.phone,
    },
    {
      type: "telegram",
      label: "Telegram ID",
      icon: <MessageCircle className="h-4 w-4" />,
      hasValue: !!manualTelegram,
      showInput: true,
    },
  ];

  // Not linked state - show account linking form
  if (!isLinked) {
    const currentValue = getSearchValue();
    const canSearch = !!currentValue;

    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-180px)] bg-muted/30 -m-6 p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-4 ring-primary/10">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Connect Your Account</CardTitle>
            <CardDescription className="text-sm">
              Link your Exode LMS account to access courses and track progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Search using:</Label>
              <div className="space-y-2">
                {identifierOptions.map((option) => {
                  const isSelected = selectedIdentifier === option.type;

                  return (
                    <div key={option.type}>
                      <button
                        type="button"
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:bg-muted/50 hover:border-muted-foreground/20"
                        )}
                        onClick={() => {
                          setSelectedIdentifier(option.type);
                          resetSearch();
                        }}
                      >
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {option.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{option.label}</span>
                          {!option.showInput && (
                            <p className="text-xs text-muted-foreground truncate">
                              {option.type === "email" ? user.email : option.type === "phone" ? user.phone : ""}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>

                      {/* Show input field for phone and telegram when selected */}
                      {isSelected && option.showInput && (
                        <div className="mt-2 ml-11">
                          <Input
                            type={option.type === "phone" ? "tel" : "text"}
                            placeholder={option.type === "phone" ? "+998901234567" : "@username or numeric ID"}
                            value={option.type === "phone" ? manualPhone : manualTelegram}
                            onChange={(e) => {
                              if (option.type === "phone") {
                                setManualPhone(e.target.value);
                              } else {
                                setManualTelegram(e.target.value);
                              }
                              resetSearch();
                            }}
                            className="text-sm h-9"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error message */}
            {linkError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{linkError}</span>
              </div>
            )}

            {/* Not found message */}
            {linkStatus === "not_found" && searchResult && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-700 dark:text-amber-500">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{searchResult}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              {/* Search button - always visible */}
              <Button
                onClick={handleSearch}
                disabled={linkStatus === "searching" || linkStatus === "creating" || !canSearch}
                className="w-full h-10"
                variant={linkStatus === "not_found" ? "outline" : "default"}
              >
                {linkStatus === "searching" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Find My Account
                  </>
                )}
              </Button>

              {/* Create account button - shown after not found or while creating */}
              {(linkStatus === "not_found" || linkStatus === "creating") && (
                <Button
                  onClick={handleCreateAccount}
                  disabled={linkStatus === "creating" || !canSearch}
                  className="w-full h-10"
                >
                  {linkStatus === "creating" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create New Account
                    </>
                  )}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center pt-1">
              Try different search methods if your account is not found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (authStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-180px)] bg-muted/30 -m-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-medium">Connecting to Learning Platform</p>
            <p className="text-sm text-muted-foreground">Setting up your session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (authStatus === "error") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-180px)] bg-muted/30 -m-6 p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Connection Failed</h3>
            <p className="text-muted-foreground text-sm mb-6">{authError || "Unable to connect to the learning platform. Please try again."}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={fetchAuthToken} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={handleUnlink} className="gap-2">
                <Unlink className="h-4 w-4" />
                Unlink Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Linked and authenticated - show iframe (fullscreen takes over entire viewport)
  return (
    <div className={cn(
      isFullscreen
        ? "fixed inset-0 z-50 bg-background"
        : "-m-6"
    )}>
      {/* Iframe Container */}
      <div className="relative h-full bg-muted/30">
        {/* Loading Overlay */}
        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Loading courses...</p>
            </div>
          </div>
        )}

        {iframeUrl && (
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className={cn(
              "w-full h-full border-0",
              isFullscreen
                ? "min-h-screen"
                : "min-h-[calc(100vh-130px)]"
            )}
            title="Exode Learning Platform"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIframeLoading(false)}
          />
        )}
      </div>
    </div>
  );
}
