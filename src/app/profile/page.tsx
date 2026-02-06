"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Region } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Key, Camera } from "lucide-react";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/constants/permissions";
import { PhoneInput } from "@/components/ui/phone-input";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [regionId, setRegionId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }

      const [userResult, regionsResult] = await Promise.all([
        supabase.from("users").select("*").eq("id", authUser.id).single(),
        supabase.from("regions").select("*").order("name"),
      ]);

      if (userResult.data) {
        setUser(userResult.data);
        setFullName(userResult.data.full_name);
        setPhone(userResult.data.phone || "");
        setBio(userResult.data.bio || "");
        setRegionId(userResult.data.region_id || "");
        setAvatarUrl(userResult.data.avatar_url);
      }

      if (regionsResult.data) {
        setRegions(regionsResult.data);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const supabase = createClient();

    // Admin can always edit, others can only edit if field was empty
    const isAdmin = user.role === "admin";
    const canEditPhone = isAdmin || !user.phone;
    const canEditRegion = isAdmin || !user.region_id;

    const updateData: Record<string, string | null> = {
      full_name: fullName,
      bio: bio || null,
    };

    // Only include phone if user can edit it
    if (canEditPhone) {
      updateData.phone = phone || null;
    }

    // Only include region if user can edit it
    if (canEditRegion) {
      updateData.region_id = regionId || null;
    }

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }

    setSaving(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setUploadingAvatar(true);
    const supabase = createClient();

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Failed to upload image");
      setUploadingAvatar(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      toast.error("Failed to update profile picture");
    } else {
      setAvatarUrl(publicUrl);
      setUser({ ...user, avatar_url: publicUrl });
      toast.success("Profile picture updated");
    }

    setUploadingAvatar(false);
  };

  const handleChangePassword = async () => {
    if (!user) return;

    // Validation
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    const supabase = createClient();

    // First verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      toast.error("Current password is incorrect");
      setChangingPassword(false);
      return;
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      toast.error("Failed to change password");
    } else {
      toast.success("Password changed successfully");
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }

    setChangingPassword(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Admin can always edit, others can only edit if field is empty
  const isAdmin = user.role === "admin";
  const canEditPhone = isAdmin || !user.phone;
  const canEditRegion = isAdmin || !user.region_id;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8 max-w-2xl">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </div>
              <div>
                <CardTitle>{user.full_name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <Badge className="mt-1" variant="secondary">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
              <p className="text-sm text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                disabled={!canEditPhone}
              />
              {!canEditPhone && (
                <p className="text-sm text-muted-foreground">Contact your admin to update phone number</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              {canEditRegion ? (
                <Select value={regionId} onValueChange={setRegionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <>
                  <Input
                    id="region"
                    value={regions.find(r => r.id === regionId)?.name || "Not assigned"}
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">Contact your admin to change region</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              variant="outline"
              className="w-full"
            >
              {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
