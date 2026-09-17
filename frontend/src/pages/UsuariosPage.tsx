import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, User, Edit, Trash2, Mail, Phone, MapPin, Key, Eye, EyeOff, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Table, Column, Pagination } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { usuarioService } from '../services/usuarioService';
import { usuarioSchema, type UsuarioFormData } from '../utils/validation';
import { formatDateTime, getEstadoColor } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useDebounce } from '../hooks/useDebounce';
import type { Usuario } from '../types/auth';
import { ROLES, catalogarRoles, idRolPorNombre, type RolCatalogo } from '../utils/roles';

type UsuarioWithRelations = Usuario & {
  rol: { id: number; nombre: string; descripcion?: string };
};

export const UsuariosPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [usuarios, setUsuarios] = useState<UsuarioWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [rolFilter, setRolFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioWithRelations | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rolesCatalogo, setRolesCatalogo] = useState<RolCatalogo[]>([]);
  const isAdmin = user?.rol?.nombre === ROLES.ADMIN;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      rolId: undefined,
    },
  });

  const incorporarRoles = (lista: Usuario[]) => {
    setRolesCatalogo((prev) => catalogarRoles([...prev.map((rol) => ({ rol })), ...lista]));
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rolId = rolFilter ? Number(rolFilter) : undefined;
      const response = await usuarioService.listar(page - 1, 10, debouncedSearch, rolId);
      setUsuarios(response.content);
      incorporarRoles(response.content);
      const totalPaginas = Math.max(1, Math.ceil(response.totalElements / 10));
      setTotalPages(totalPaginas);
      setTotalItems(response.totalElements);
      if (page > totalPaginas) {
        setPage(totalPaginas);
      }
    } catch {
      setUsuarios([]);
      setLoadError('No se pudieron cargar los usuarios');
      addNotification({ type: 'error', title: 'Error', message: 'No se pudieron cargar los usuarios' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [page, debouncedSearch, rolFilter]);

  useEffect(() => {
    usuarioService.listarTodos()
      .then(incorporarRoles)
      .catch(() => undefined);
  }, []);

  const handleEdit = (usuario: UsuarioWithRelations) => {
    setEditingUsuario(usuario);
    setShowPassword(false);
    reset({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono || '',
      direccion: usuario.direccion || '',
      rolId: usuario.rol?.id,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingUsuario(null);
    setShowPassword(false);
    reset({
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      telefono: '',
      direccion: '',
      rolId: idRolPorNombre(rolesCatalogo, ROLES.CLIENTE),
    });
    setShowModal(true);
  };

  const onSubmit = async (data: UsuarioFormData) => {
    if (!editingUsuario && !data.password) {
      addNotification({ type: 'error', title: 'Error', message: 'La contraseña es obligatoria' });
      return;
    }
    const rolId = data.rolId ?? idRolPorNombre(rolesCatalogo, ROLES.CLIENTE);
    if (rolId == null) {
      addNotification({ type: 'error', title: 'Error', message: 'Selecciona un rol' });
      return;
    }
    setSaving(true);
    try {
      if (editingUsuario) {
        await usuarioService.actualizar(editingUsuario.id, { ...data, rolId });
        addNotification({ type: 'success', title: 'Éxito', message: 'Usuario actualizado' });
      } else {
        await usuarioService.crear({ ...data, password: data.password!, rolId });
        addNotification({ type: 'success', title: 'Éxito', message: 'Usuario creado' });
      }
      setShowModal(false);
      fetchUsuarios();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al guardar';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await usuarioService.eliminar(id);
      addNotification({ type: 'success', title: 'Éxito', message: 'Usuario eliminado' });
      setShowDeleteConfirm(null);
      fetchUsuarios();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setDeleting(false);
    }
  };

  const rolOptions = rolesCatalogo.map((rol) => ({ value: String(rol.id), label: rol.nombre }));

  const columns: Column<UsuarioWithRelations>[] = [
    {
      key: 'nombreCompleto',
      header: 'Nombre',
      render: (u) => (
        <span className="font-medium text-surface-800 dark:text-surface-100">
          {u.nombreCompleto || `${u.nombre} ${u.apellido}`}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (u) => <span className="text-surface-600 dark:text-surface-300">{u.email}</span>,
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (u) => <span className="text-surface-600 dark:text-surface-300">{u.telefono || '—'}</span>,
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (u) => (
        <Badge variant={getEstadoColor(u.rol?.nombre || '') as 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary'} dot>
          {u.rol?.nombre}
        </Badge>
      ),
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (u) =>
        u.emailVerificado === false ? (
          <Badge variant="warning" dot>Pendiente</Badge>
        ) : (
          <Badge variant={u.activo ? 'success' : 'gray'} dot>
            {u.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
    },
    {
      key: 'fechaCreacion',
      header: 'Creado',
      render: (u) => (
        <span className="tabular-nums text-surface-600 dark:text-surface-300">{formatDateTime(u.fechaCreacion)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center',
      render: (u) =>
        isAdmin ? (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(u);
              }}
              aria-label="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {u.id !== user?.id && (
              <Button
                variant="ghost"
                size="icon"
                className="text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(u.id);
                }}
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : null,
    },
  ];

  const mostrarVacio = !loading && !loadError && usuarios.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            Administración
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Gestiona usuarios del sistema
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleNew} className="shrink-0 self-start sm:self-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo usuario
          </Button>
        )}
      </header>

      <Card className="overflow-hidden" padding="none">
        <div className="border-b border-surface-100 px-4 py-4 dark:border-surface-800 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <Input
                label="Buscar"
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Nombre, email…"
                leftIcon={<Search className="h-5 w-5" />}
              />
            </div>
            <div className="w-full lg:w-56">
              <Select
                label="Rol"
                value={rolFilter}
                onChange={(e) => {
                  setRolFilter(e.target.value);
                  setPage(1);
                }}
                options={[{ value: '', label: 'Todos' }, ...rolOptions]}
              />
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {loadError && !loading && (
            <div
              className="m-4 flex flex-col items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-danger-800 dark:bg-danger-950/40"
              role="alert"
            >
              <div className="flex items-start gap-3 text-sm text-danger-800 dark:text-danger-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>{loadError}</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={fetchUsuarios}>
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          )}

          {mostrarVacio ? (
            <div className="empty-state px-4">
              <User className="empty-state-icon" aria-hidden="true" />
              <h2 className="empty-state-title">No hay usuarios</h2>
              <p className="empty-state-text">
                {search || rolFilter
                  ? 'Prueba con otros filtros o limpia la búsqueda.'
                  : 'Todavía no hay usuarios en el listado.'}
              </p>
              {isAdmin && !search && !rolFilter && (
                <Button type="button" onClick={handleNew}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Crear primer usuario
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={usuarios}
                keyExtractor={(u) => u.id.toString()}
                loading={loading}
                hoverable
                striped
                emptyMessage="No hay usuarios registrados"
                emptyIcon={<User className="h-12 w-12 text-surface-300 dark:text-surface-600" />}
              />

              {!loadError && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.max(totalPages, 1)}
                  onPageChange={setPage}
                  showPerPage
                  perPage={10}
                  totalItems={totalItems}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!saving) setShowModal(false);
        }}
        title={editingUsuario ? 'Editar usuario' : 'Nuevo usuario'}
        description="Completa los datos del usuario del sistema."
        size="lg"
        closeOnOverlayClick={!saving}
        closeOnEscape={!saving}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              {...register('nombre')}
              label="Nombre *"
              placeholder="Juan"
              error={errors.nombre?.message}
              disabled={saving}
            />
            <Input
              {...register('apellido')}
              label="Apellido *"
              placeholder="Pérez"
              error={errors.apellido?.message}
              disabled={saving}
            />
          </div>

          <Input
            {...register('email')}
            type="email"
            autoComplete="email"
            label="Correo electrónico *"
            placeholder="tu@email.com"
            leftIcon={<Mail className="h-5 w-5" />}
            error={errors.email?.message}
            disabled={saving}
          />

          {!editingUsuario && (
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              label="Contraseña *"
              placeholder="••••••••"
              leftIcon={<Key className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={
                    `rounded-lg p-0.5 text-surface-400 transition-colors ` +
                    `hover:text-surface-700 dark:text-surface-500 dark:hover:text-surface-200 ` +
                    `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`
                  }
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={saving ? -1 : 0}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
              error={errors.password?.message}
              disabled={saving}
            />
          )}

          <Input
            {...register('telefono')}
            type="tel"
            label="Teléfono (opcional)"
            placeholder="+506 1234 5678"
            leftIcon={<Phone className="h-5 w-5" />}
            disabled={saving}
          />

          <Input
            {...register('direccion')}
            label="Dirección (opcional)"
            placeholder="Calle principal, San José"
            leftIcon={<MapPin className="h-5 w-5" />}
            disabled={saving}
          />

          <Select
            {...register('rolId', { valueAsNumber: true })}
            label="Rol *"
            options={rolOptions}
            placeholder="Selecciona un rol"
            error={errors.rolId?.message}
            disabled={saving}
          />

          <div className="flex justify-end gap-3 border-t border-surface-100 pt-4 dark:border-surface-800">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingUsuario ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => {
          if (!deleting) setShowDeleteConfirm(null);
        }}
        onConfirm={() => handleDelete(showDeleteConfirm!)}
        title="¿Eliminar usuario?"
        message="Esta acción eliminará el usuario permanentemente. ¿Deseas continuar?"
        variant="danger"
        confirmText="Eliminar"
        loading={deleting}
      />
    </div>
  );
};
