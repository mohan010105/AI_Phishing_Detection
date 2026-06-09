import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Loader2, Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@/services";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Passkey must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Must contain at least one number" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your new passkey" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passkeys do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setIsInvalidToken(true);
    } else {
      setResetToken(token);
    }
  }, []);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const watchPassword = form.watch("password");
  const passwordChecks = {
    length: watchPassword?.length >= 8,
    uppercase: /[A-Z]/.test(watchPassword ?? ""),
    lowercase: /[a-z]/.test(watchPassword ?? ""),
    number: /[0-9]/.test(watchPassword ?? ""),
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!resetToken) return;
    setIsSubmitting(true);
    try {
      await customFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, password: data.password }),
      });

      setIsSuccess(true);
      toast({
        title: "Password Updated",
        description: "Your passkey has been reset successfully.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: err.data?.error || "Could not reset password.",
      });
      if (err.status === 400 || err.status === 401) {
        setIsInvalidToken(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-mono">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/">
          <div className="flex justify-center items-center gap-2 cursor-pointer mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl tracking-tight">PHISH_GUARD</span>
          </div>
        </Link>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-foreground tracking-tight">
          Reset Passkey
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <Card className="border-border bg-card shadow-2xl">
          <CardHeader>
            <CardTitle>Set New Passkey</CardTitle>
            <CardDescription>
              {isSuccess
                ? "Your passkey has been updated."
                : isInvalidToken
                ? "This reset link is invalid or expired."
                : "Enter your new passkey below."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-foreground font-medium">Passkey Updated</p>
                  <p className="text-xs text-muted-foreground">
                    You can now use your new passkey to login.
                  </p>
                </div>
                <Button
                  className="mt-2"
                  onClick={() => setLocation("/login")}
                >
                  Proceed to Login
                </Button>
              </motion.div>
            ) : isInvalidToken ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-foreground font-medium">Invalid Reset Link</p>
                  <p className="text-xs text-muted-foreground">
                    This reset link is invalid or has expired. Please request a new one.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setLocation("/forgot-password")}
                >
                  Request New Link
                </Button>
              </motion.div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Passkey</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              id="reset-password"
                              placeholder="••••••••"
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              className="bg-secondary/50 border-border font-mono pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                        {watchPassword && (
                          <div className="mt-2 space-y-1">
                            {[
                              { key: 'length', label: 'At least 8 characters' },
                              { key: 'uppercase', label: 'One uppercase letter' },
                              { key: 'lowercase', label: 'One lowercase letter' },
                              { key: 'number', label: 'One number' },
                            ].map(({ key, label }) => (
                              <div key={key} className={`flex items-center gap-2 text-xs ${passwordChecks[key as keyof typeof passwordChecks] ? 'text-green-500' : 'text-muted-foreground'}`}>
                                <CheckCircle2 className="h-3 w-3" />
                                {label}
                              </div>
                            ))}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Passkey</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              id="reset-confirm-password"
                              placeholder="••••••••"
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              className="bg-secondary/50 border-border font-mono pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Update Passkey
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t border-border pt-6">
            <Link href="/login">
              <span className="text-sm text-primary hover:text-primary/80 cursor-pointer underline-offset-4 hover:underline">
                Back to Login
              </span>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
