
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { KeyRound, UserCircle } from "lucide-react";
import type { User } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

// In a real app, password comparison would be done on the backend with hashed passwords.
// For this prototype, we'll do a simple string comparison.
const verifyPassword = (enteredPassword: string, storedPasswordHash: string): boolean => {
  // This is a placeholder for actual password hashing and verification
  // For the prototype, we assume storedPasswordHash is the plain text password
  return enteredPassword === storedPasswordHash;
};

const loginFormSchema = z.object({
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface UserLoginDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userToLogin: User | null;
  onLoginSuccess: (user: User) => void;
}

export function UserLoginDialog({
  isOpen,
  onOpenChange,
  userToLogin,
  onLoginSuccess,
}: UserLoginDialogProps) {
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = (data: LoginFormValues) => {
    if (!userToLogin) return;

    // IMPORTANT: This is a placeholder for actual password verification.
    // In a real app, never compare plain text passwords on the client-side.
    if (verifyPassword(data.password, userToLogin.passwordHash)) {
      toast({
        title: "Inicio de Sesión Exitoso",
        description: `Bienvenido, ${userToLogin.name}.`,
      });
      onLoginSuccess(userToLogin);
      onOpenChange(false);
    } else {
      toast({
        title: "Contraseña Incorrecta",
        description: "La contraseña ingresada no es válida.",
        variant: "destructive",
      });
      form.setError("password", { message: "Contraseña incorrecta." });
    }
  };

  if (!userToLogin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserCircle className="mr-2 h-5 w-5 text-primary" />
            Iniciar Sesión como {userToLogin.name}
          </DialogTitle>
          <DialogDescription>
            Ingresa la contraseña para el usuario {userToLogin.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Ingresa tu contraseña" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <KeyRound className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
