import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MailCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { recuperarPasswordSchema, type RecuperarPasswordFormData } from '../utils/validation';
import { useUIStore } from '../store/uiStore';
import { authService } from '../services/authService';

export default function RecuperarPasswordPage() {
  const { addNotification } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarPasswordFormData>({
    resolver: zodResolver(recuperarPasswordSchema),
  });

  const onSubmit = async (data: RecuperarPasswordFormData) => {
    setLoading(true);
    try {
      await authService.recuperarPassword(data);
      setEnviado(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al solicitar la recuperación';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
            <MailCheck className="h-8 w-8 text-brand-600 dark:text-brand-300" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Revisa tu correo</h2>
          <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm">
            Si el correo está registrado, recibirás un enlace o token para
            restablecer tu contraseña.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-300 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Recuperar contraseña</h2>
        <p className="text-surface-500 dark:text-surface-400 mt-1 text-sm">
          Ingresa tu correo y te enviaremos instrucciones
        </p>
      </div>

      <div className="space-y-5">
        <Input
          {...register('email')}
          type="email"
          label="Correo electrónico"
          placeholder="tu@email.com"
          leftIcon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          disabled={loading}
        />

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Enviar instrucciones
        </Button>
      </div>

      <p className="text-center text-sm text-surface-500 dark:text-surface-400">
        ¿Recordaste tu contraseña?{' '}
        <Link to="/login" className="text-brand-600 hover:text-brand-700 dark:text-brand-300 font-medium">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
