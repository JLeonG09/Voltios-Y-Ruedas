import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AccesoDenegadoPage } from '../../pages/AccesoDenegadoPage';
import { tieneRol } from '../../utils/roles';
import type { NombreRol } from '../../types';

interface RutaConRolesProps {
  roles: readonly NombreRol[];
  children: ReactElement;
}

export const RutaConRoles = ({ roles, children }: RutaConRolesProps) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!tieneRol(user, roles)) return <AccesoDenegadoPage />;
  return children;
};
