"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ExternalLink, Loader2, AlertCircle, Mail, Phone, MessageCircle, Search, UserPlus, Unlink } from "lucide-react";
import { User } from "@/types";
import { SearchByType } from "@/lib/exode/types";

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
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Fetch auth token when component mounts and account is linked
  useEffect(() => {
    if (isLinked) {
      fetchAuthToken();
    }
  }, [isLinked]);

  const fetchAuthToken = async () => {
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
  };

  const handleUnlink = async () => {
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
  };

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Learning</h1>
          <p className="text-muted-foreground">Access courses and track your progress</p>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Connect Your Learning Account</CardTitle>
              <CardDescription>
                Link your Exode account to access courses and track your progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Search for your account using:</Label>
                <div className="space-y-2">
                  {identifierOptions.map((option) => {
                    const isSelected = selectedIdentifier === option.type;

                    return (
                      <div key={option.type}>
                        <label
                          className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          }`}
                          onClick={() => {
                            setSelectedIdentifier(option.type);
                            resetSearch();
                          }}
                        >
                          <input
                            type="radio"
                            name="identifier"
                            value={option.type}
                            checked={isSelected}
                            onChange={() => {
                              setSelectedIdentifier(option.type);
                              resetSearch();
                            }}
                            className="h-4 w-4 text-primary"
                          />
                          <span className="flex items-center gap-2">
                            {option.icon}
                            <span className="font-medium">{option.label}:</span>
                          </span>
                          {!option.showInput && (
                            <span className="flex-1 text-sm text-muted-foreground truncate">
                              {option.type === "email" ? user.email : option.type === "phone" ? user.phone : ""}
                            </span>
                          )}
                        </label>

                        {/* Show input field for phone and telegram when selected */}
                        {isSelected && option.showInput && (
                          <div className="mt-2 ml-7">
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
                              className="text-sm"
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
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}

              {/* Not found message */}
              {linkStatus === "not_found" && searchResult && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <span>{searchResult}</span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2">
                {/* Search button - always visible */}
                <Button
                  onClick={handleSearch}
                  disabled={linkStatus === "searching" || linkStatus === "creating" || !canSearch}
                  className="w-full"
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
                      Search Account
                    </>
                  )}
                </Button>

                {/* Create account button - shown after not found or while creating */}
                {(linkStatus === "not_found" || linkStatus === "creating") && (
                  <Button
                    onClick={handleCreateAccount}
                    disabled={linkStatus === "creating" || !canSearch}
                    className="w-full"
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

              <p className="text-xs text-muted-foreground text-center">
                Search using different methods if your account is not found with one.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (authStatus === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Learning</h1>
            <p className="text-muted-foreground">Access courses and track your progress</p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading learning platform...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (authStatus === "error") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Learning</h1>
            <p className="text-muted-foreground">Access courses and track your progress</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="font-semibold">Failed to load learning platform</h3>
            <p className="text-muted-foreground mb-4">{authError}</p>
            <Button onClick={fetchAuthToken}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Linked and authenticated - show iframe
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning</h1>
          <p className="text-muted-foreground">Access courses and track your progress</p>
        </div>
        <div className="flex items-center gap-4">
          {iframeUrl && (
            <a
              href={iframeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Open in New Tab <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnlink}
            disabled={isUnlinking}
            className="text-muted-foreground"
          >
            {isUnlinking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Unlink className="mr-2 h-4 w-4" />
            )}
            Unlink Account
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[600px] rounded-lg border bg-background overflow-hidden">
        {iframeUrl && (
          <iframe
            src={iframeUrl}
            className="w-full h-full min-h-[600px]"
            title="Exode Learning Platform"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
