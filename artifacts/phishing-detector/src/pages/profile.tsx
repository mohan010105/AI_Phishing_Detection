import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, useChangePassword } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User as UserIcon, Shield, KeyRound, Mail, Calendar, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const [nameChanged, setNameChanged] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onProfileSubmit = (data: ProfileValues) => {
    updateProfileMutation.mutate(
      { data: { name: data.name } },
      {
        onSuccess: (updated) => {
          const storedToken = localStorage.getItem("phishing_token");
          if (storedToken) {
            const parts = storedToken.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const newPayload = { ...payload, name: updated.name };
              const newPayloadStr = btoa(JSON.stringify(newPayload));
              const newToken = `${parts[0]}.${newPayloadStr}.${parts[2]}`;
              login(newToken);
            }
          }
          setNameChanged(true);
          toast({ title: "Profile Updated", description: "Your display name has been saved." });
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Update Failed", description: err.data?.error ?? "Could not update profile." });
        },
      }
    );
  };

  const onPasswordSubmit = (data: PasswordValues) => {
    changePasswordMutation.mutate(
      { data: { currentPassword: data.currentPassword, newPassword: data.newPassword } },
      {
        onSuccess: () => {
          passwordForm.reset();
          toast({ title: "Password Changed", description: "Your password has been updated successfully." });
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Password Change Failed", description: err.data?.error ?? "Could not change password." });
        },
      }
    );
  };

  const joinDate = (() => {
    const token = localStorage.getItem("phishing_token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.iat ? new Date(payload.iat * 1000) : null;
    } catch { return null; }
  })();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-primary" />
            Operator Profile
          </h1>
          <p className="text-muted-foreground mt-1">Manage your identity and access credentials.</p>
        </div>

        {/* Account Overview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Identity Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold border border-primary/30">
                  {(nameChanged ? profileForm.getValues("name") : user?.name)?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div>
                  <div className="text-xl font-bold">{nameChanged ? profileForm.getValues("name") : user?.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={user?.role === "admin" ? "destructive" : "secondary"} className="uppercase text-xs tracking-wider">
                      {user?.role === "admin" ? (
                        <><Shield className="h-3 w-3 mr-1" /> Admin</>
                      ) : (
                        <><ShieldCheck className="h-3 w-3 mr-1" /> Operator</>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="font-mono">{user?.email}</span>
                </div>
                {joinDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {format(joinDate, "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Update Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle>Update Display Name</CardTitle>
              <CardDescription>Change how your name appears across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex gap-3 items-start">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="sr-only">Display Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter display name"
                            className="bg-secondary/30 font-mono"
                            disabled={updateProfileMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateProfileMutation.isPending} className="shrink-0">
                    {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Change Password
              </CardTitle>
              <CardDescription>Update your authentication credentials. Minimum 8 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter current password"
                            className="bg-secondary/30 font-mono"
                            disabled={changePasswordMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter new password (min 8 chars)"
                            className="bg-secondary/30 font-mono"
                            disabled={changePasswordMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Repeat new password"
                            className="bg-secondary/30 font-mono"
                            disabled={changePasswordMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={changePasswordMutation.isPending} className="w-full sm:w-auto">
                    {changePasswordMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
                    ) : (
                      <><KeyRound className="h-4 w-4 mr-2" /> Update Password</>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
