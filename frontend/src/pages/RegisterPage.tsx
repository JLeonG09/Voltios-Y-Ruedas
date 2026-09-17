import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  MapPin,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { registerSchema, type RegisterFormData } from "../utils/validation";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { authService } from "../services/authService";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password") || "";

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const creado = await authService.register(data);
      if (creado.emailVerificado === false) {
        addNotification({
          type: "success",
          title: "¡Cuenta creada!",
          message: "Revisa tu correo y verifica tu cuenta para poder iniciar sesión",
        });
        navigate(`/verificar-email?email=${encodeURIComponent(creado.email)}`);
        return;
      }
      addNotification({
        type: "success",
        title: "¡Bienvenido!",
        message: "Tu cuenta ha sido creada correctamente",
      });
      navigate("/login");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error al registrarse";
      if (/ya está registrad|ya existe/i.test(message)) {
        addNotification({
          type: "warning",
          title: "Cuenta ya registrada",
          message:
            "Ya existe una cuenta con este correo. ¿Deseas iniciar sesión?",
          duration: 8000,
          action: {
            label: "Ir a iniciar sesión",
            onClick: () => navigate("/login", { state: { email: data.email } }),
          },
        });
      } else {
        addNotification({ type: "error", title: "Error", message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
          Crear cuenta
        </h2>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Únete a Voltios y Ruedas
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            {...register("nombre")}
            label="Nombre"
            placeholder="Juan"
            leftIcon={<User className="h-5 w-5" />}
            error={errors.nombre?.message}
            disabled={loading}
          />
          <Input
            {...register("apellido")}
            label="Apellido"
            placeholder="Pérez"
            leftIcon={<User className="h-5 w-5" />}
            error={errors.apellido?.message}
            disabled={loading}
          />
        </div>

        <Input
          {...register("email")}
          type="email"
          label="Correo electrónico"
          placeholder="tu@email.com"
          leftIcon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          disabled={loading}
        />

        <Input
          {...register("password")}
          type={showPassword ? "text" : "password"}
          label="Contraseña"
          placeholder="••••••••"
          leftIcon={<Lock className="h-5 w-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-surface-400 hover:text-surface-600"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
          helperText={
            password.length > 0 && password.length < 8
              ? "Mínimo 8 caracteres"
              : undefined
          }
          error={errors.password?.message}
          disabled={loading}
        />

        <Input
          {...register("telefono")}
          type="tel"
          label="Teléfono (opcional)"
          placeholder="+506 1234 5678"
          leftIcon={<Phone className="h-5 w-5" />}
          error={errors.telefono?.message}
          disabled={loading}
        />

        <Input
          {...register("direccion")}
          label="Dirección (opcional)"
          placeholder="Calle principal, San José"
          leftIcon={<MapPin className="h-5 w-5" />}
          error={errors.direccion?.message}
          disabled={loading}
        />

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Crear cuenta
        </Button>
      </div>

      <p className="text-center text-sm text-surface-500 dark:text-surface-400">
        ¿Ya tienes cuenta?{" "}
        <Link
          to="/login"
          className="text-brand-600 hover:text-brand-700 font-medium"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
};
