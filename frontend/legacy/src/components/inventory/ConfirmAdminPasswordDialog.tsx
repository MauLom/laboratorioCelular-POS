
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
import { ShieldAlert, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const passwordFormSchema = z.object({
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface ConfirmAdminPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthenticationSuccess: () => void;
  requiredPassword?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  confirmButtonText?: string;
}

export function ConfirmAdminPasswordDialog({
  isOpen,
  onOpenChange,
  onAuthenticationSuccess,
  requiredPassword,
  dialogTitle = "Acceso Restringido",
  dialogDescription = "Ingresa la contraseña de administrador para continuar.",
  confirmButtonText = "Confirmar",
}: ConfirmAdminPasswordDialogProps) {
  const { toast } = useToast();
  const [showPasswordError, setShowPasswordError] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ password: "" });
      setShowPasswordError(false);
    }
  }, [isOpen, form]);

  const onSubmit = (data: PasswordFormValues) => {
    if (requiredPassword && data.password === requiredPassword) {
      setShowPasswordError(false);
      onAuthenticationSuccess();
      onOpenChange(false); 
    } else {
      setShowPasswordError(true);
      toast({
        title: "Contraseña Incorrecta",
        description: "La contraseña ingresada no es válida.",
        variant: "destructive",
      });
      form.setError("password", { message: "Contraseña incorrecta." });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldAlert className="mr-2 h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña de Administrador</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Ingresa la contraseña" 
                      {...field} 
                      className={showPasswordError ? "border-destructive focus-visible:ring-destructive" : ""}
                      onChange={(e) => {
                        field.onChange(e);
                        if (showPasswordError) setShowPasswordError(false);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {showPasswordError && !form.formState.errors.password && (
                    <p className="text-sm font-medium text-destructive">
                      La contraseña proporcionada es incorrecta.
                    </p>
                  )}
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <KeyRound className="mr-2 h-4 w-4" />
                {confirmButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
