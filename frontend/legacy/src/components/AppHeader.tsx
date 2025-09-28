
"use client";
import { useState, useEffect } from "react";
import { Smartphone, LogOut, Users, UserCircle, UserCheck, Building } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, UserRole, Store } from "@/types/inventory";

interface AppHeaderProps {
  currentUser: User | null;
  adminUsers: User[];
  consultasUsers: User[]; // These are base users without storeId
  stores: Store[];
  onUserSelect: (user: User) => void; 
  onLogout: () => void;
}

export function AppHeader({ 
  currentUser, 
  adminUsers,
  consultasUsers,
  stores,
  onUserSelect, 
  onLogout 
}: AppHeaderProps) {
  const [selectedUserType, setSelectedUserType] = useState<UserRole | "">("");
  const [selectedStoreIdForConsultasLogin, setSelectedStoreIdForConsultasLogin] = useState<string | null>(null);


  useEffect(() => {
    if (!currentUser) {
      setSelectedUserType("");
      setSelectedStoreIdForConsultasLogin(null);
    }
  }, [currentUser]);

  const handleUserTypeChange = (value: string) => {
    setSelectedUserType(value as UserRole | "");
    setSelectedStoreIdForConsultasLogin(null); // Reset store selection if user type changes
  };

  const handleConsultasStoreSelect = (storeId: string) => {
    setSelectedStoreIdForConsultasLogin(storeId);
  };
  
  const handleFinalUserSelection = (userId: string) => {
    let userToLoginBase: User | undefined;
    let storeIdForSession: string | undefined = undefined;

    if (selectedUserType === 'admin') {
      userToLoginBase = adminUsers.find(u => u.id === userId);
    } else if (selectedUserType === 'consultas') {
      userToLoginBase = consultasUsers.find(u => u.id === userId);
      storeIdForSession = selectedStoreIdForConsultasLogin ?? undefined;
      if (!storeIdForSession) {
        // Should not happen if UI is correctly managed, but as a safeguard
        console.error("Store ID not selected for consultas login.");
        return;
      }
    }

    if (userToLoginBase) {
      // Construct the user object for the session, including storeId if it's a consultas user
      const userForSession: User = {
        ...userToLoginBase,
        storeId: storeIdForSession, // Will be undefined for admins, set for consultas
      };
      onUserSelect(userForSession);
    }
  };

  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Smartphone className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-2xl font-headline font-semibold text-foreground">
            CellTrack
          </h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {currentUser ? (
            <>
              <div className="flex items-center space-x-2">
                <UserCircle className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Hola, {currentUser.name} ({currentUser.role})
                  {currentUser.role === 'consultas' && currentUser.storeId && (
                    ` - ${stores.find(s => s.id === currentUser.storeId)?.name || 'Tienda Desconocida'}`
                  )}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center space-x-1">
                <Users className="h-5 w-5 text-muted-foreground hidden sm:block" />
                <Select onValueChange={handleUserTypeChange} value={selectedUserType}>
                  <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Tipo de Usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="consultas">Consultas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedUserType === 'admin' && (
                <div className="flex items-center space-x-1">
                 <UserCheck className="h-5 w-5 text-muted-foreground hidden sm:block" />
                  <Select onValueChange={handleFinalUserSelection}>
                    <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Usuario Admin" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedUserType === 'consultas' && (
                <>
                  <div className="flex items-center space-x-1">
                    <Building className="h-5 w-5 text-muted-foreground hidden sm:block" />
                    <Select 
                      onValueChange={handleConsultasStoreSelect} 
                      value={selectedStoreIdForConsultasLogin || ""}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Selecciona Tienda" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.filter(s => s.id !== 'store6').map((store) => ( // Exclude Bodega for direct login
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-1">
                    <UserCheck className="h-5 w-5 text-muted-foreground hidden sm:block" />
                    <Select 
                      onValueChange={handleFinalUserSelection} 
                      disabled={!selectedStoreIdForConsultasLogin}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs sm:text-sm" disabled={!selectedStoreIdForConsultasLogin}>
                        <SelectValue placeholder="Usuario Consulta" />
                      </SelectTrigger>
                      <SelectContent>
                        {consultasUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
