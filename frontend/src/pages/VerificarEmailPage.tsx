import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ShieldCheck, Send, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useUIStore } from '../store/uiStore';
import { authService } from '../services/authService';

const verificarSchema = z.object({
  email: z.string().min(1, 'El email es obligatorio'),
  codigo: z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
});
type VerificarFormData = z.infer<typeof verificarSchema>;

export const VerificarEmailPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [searchParams] = useSearchParams();
  const emailInicial = searchParams.get('email') ?? '';
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificarFormData>({
    resolver: zodResolver(verificarSchema),
    defaultValues: { email: emailInicial, codigo: '' },
  });

  const onSubmit = async (data: VerificarFormData) => {
    setLoading(true);
    try {
      await authService.verificarEmail(data);
      addNotification({
        type: 'success',
        title: '¡Correo verificado!',
        message: 'Tu cuenta ya está activa, puedes iniciar sesión',
      });
      navigate('/login');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo verificar el correo';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setLoading(false);
    }
  };

  const reenviar = async (data?: VerificarFormData) => {
    const email = data?.email ?? emailInicial;
    if (!email) return;
    setEnviando(true);
    try {
      const result = await authService.reenviarCodigo(email);
      addNotification({
        type: 'success',
        title: 'Código enviado',
        message: result.mensaje,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo reenviar el código';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-4">
          <ShieldCheck className="h-7 w-7 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
          Verifica tu correo
        </h2>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Ingresa el código de 6 dígitos que enviamos a tu correo
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
          disabled={loading || enviando}
        />

        <Input
          {...register('codigo')}
          inputMode="numeric"
          maxLength={6}
          label="Código de verificación"
          placeholder="123456"
          leftIcon={<Send className="h-5 w-5" />}
          error={errors.codigo?.message}
          disabled={loading || enviando}
        />

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Verificar correo
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-surface-500 dark:text-surface-400">
            ¿No recibiste el código?
          </span>
          <button
            type="button"
            onClick={() => reenviar()}
            disabled={enviando || loading}
            className="text-brand-600 hover:text-brand-700 dark:text-brand-300 font-medium inline-flex items-center gap-1"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reenviar'}
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-surface-500 dark:text-surface-400">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
};