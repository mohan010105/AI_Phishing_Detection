import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Loader2, UserPlus, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import { useRegister } from "@/services";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Passkey must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Must contain at least one number" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your passkey" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passkeys do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const registerMutation = useRegister();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
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

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      { data: { name: data.name, email: data.email, password: data.password } },
      {
        onSuccess: (response) => {
          login(response.token, {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role as 'user' | 'admin',
          });
          toast({
            title: "Clearance Granted",
            description: "Account created successfully.",
          });
          if (response.user.role === "admin") {
            setLocation("/admin");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.data?.error || "Could not process request.",
          });
        },
      }
    );
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
          Request Clearance
        </h2>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <Card className="border-border bg-card shadow-2xl">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Initialize your operator profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operator Alias</FormLabel>
                      <FormControl>
                        <Input 
                          id="register-name"
                          placeholder="John Doe" 
                          className="bg-secondary/50 border-border font-mono"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secure Email</FormLabel>
                      <FormControl>
                        <Input 
                          id="register-email"
                          placeholder="analyst@domain.com" 
                          type="email" 
                          autoComplete="email"
                          className="bg-secondary/50 border-border font-mono"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passkey</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            id="register-password"
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
                      <FormLabel>Confirm Passkey</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            id="register-confirm-password"
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
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Initialize Profile
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Already cleared?{" "}
              <Link href="/login">
                <span className="font-medium text-primary hover:text-primary/80 cursor-pointer underline-offset-4 hover:underline">
                  Authenticate
                </span>
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
