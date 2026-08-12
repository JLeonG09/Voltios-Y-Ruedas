import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Filter, User, ChevronDown, Edit, Trash2, Shield, Mail, Phone, MapPin, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Table, Column, Pagination } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { usuarioService } from '../services/usuarioService';
import { registerSchema, type RegisterFormData } from '../utils/validation';
import { formatDateTime, getEstadoColor } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useEffect } from 'react';
import type { Usuario } from '../types/auth';

type UsuarioWithRelations = Usuario & {
  rol: { id: number; nombre: string; descripcion?: string };
};

export const UsuariosPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [usuarios, setUsuarios] = useState<UsuarioWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioWithRelations | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const isAdmin = user?.rol?.nombre === 'ADMIN';

  const columns: Column<UsuarioWithRelations>[] = [
    { key: 'nombreCompleto', header: 'Nombre', render: (u) => u.nombreCompleto },
    { key: 'email', header: 'Email' },
    { key: 'telefono', header: 'Teléfono', render: (u) => u.telefono || '-' },
    { key: 'rol', header: 'Rol', render: (u) => (
      <Badge variant={getEstadoColor(u.rol?.nombre || '') as any} dot>
        {u.rol?.nombre}
      </Badge>
    )},
    { key: 'activo', header: 'Estado', render: (u) => (
      <Badge variant={u.activo ? 'success' : 'gray'} dot>
        {u.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    )},
    { key: 'fechaCreacion', header: 'Creado', render: (u) => formatDateTime(u.fechaCreacion) },
    { key: 'actions', header: 'Acciones', align: 'center', render: (u, idx) => (
      <div className="flex items-center gap-1 justify-center">
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(u); }} aria-label="Editar">
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {isAdmin && u.id !== user?.id && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(u.id); }} aria-label="Eliminar" className="text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    )},
  ];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      rolId: 4,
    },
  });

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await usuarioService.listar(page - 1, 10);
      setUsuarios(response.content);
      setTotalPages(Math.ceil(response.totalElements / 10));
      setTotalItems(response.totalElements);
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'No se pudieron cargar los usuarios' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [page, search, rolFilter]);

  const handleEdit = (usuario: UsuarioWithRelations) => {
    setEditingUsuario(usuario);
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
    reset({ 
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      telefono: '',
      direccion: '',
      rolId: 4,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      if (editingUsuario) {
        await usuarioService.actualizar(editingUsuario.id, data);
        addNotification({ type: 'success', title: 'Éxito', message: 'Usuario actualizado' });
      } else {
        await usuarioService.crear({ ...data, rolId: data.rolId ?? 4 });
        addNotification({ type: 'success', title: 'Éxito', message: 'Usuario creado' });
      }
      setShowModal(false);
      fetchUsuarios();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al guardar';
      addNotification({ type: 'error', title: 'Error', message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await usuarioService.eliminar(id);
      addNotification({ type: 'success', title: 'Éxito', message: 'Usuario eliminado' });
      setShowDeleteConfirm(null);
      fetchUsuarios();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar';
      addNotification({ type: 'error', title: 'Error', message });
    }
  };

  const rolOptions = [
    { value: '4', label: 'CLIENTE' },
    { value: '3', label: 'MECANICO' },
    { value: '2', label: 'JEFE_TALLER' },
    { value: '1', label: 'ADMIN' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Usuarios</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Gestiona usuarios del sistema</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      <Card subtitle="Listado de usuarios del sistema">
        <CardContent className="p-0">
          <div className="p-4 border-b border-surface-100 dark:border-surface-800">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-surface-300 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-surface-800 dark:text-white dark:placeholder:text-surface-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500" />
                <Select
                  value={rolFilter}
                  onChange={(e) => setRolFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Todos los roles' },
                    ...rolOptions,
                  ]}
                  placeholder="Filtrar por rol"
                  className="w-full sm:w-48"
                />
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            data={usuarios}
            keyExtractor={(u) => u.id.toString()}
            loading={loading}
            hoverable
            striped
            emptyMessage="No hay usuarios registrados"
            emptyIcon={<User className="w-12 h-12 text-surface-300 dark:text-surface-600" />}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showPerPage
            perPage={10}
            totalItems={totalItems}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUsuario ? 'Editar usuario' : 'Nuevo usuario'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              {...register('nombre')}
              label="Nombre *"
              placeholder="Juan"
              error={errors.nombre?.message}
            />
            <Input
              {...register('apellido')}
              label="Apellido *"
              placeholder="Pérez"
              error={errors.apellido?.message}
            />
          </div>

          <Input
            {...register('email')}
            type="email"
            label="Correo electrónico *"
            placeholder="tu@email.com"
            leftIcon={<Mail className="h-5 w-5" />}
            error={errors.email?.message}
          />

          {!editingUsuario && (
            <Input
              {...register('password')}
              type="password"
              label="Contraseña *"
              placeholder="••••••••"
              leftIcon={<Key className="h-5 w-5" />}
              error={errors.password?.message}
            />
          )}

          <Input
            {...register('telefono')}
            type="tel"
            label="Teléfono (opcional)"
            placeholder="+506 1234 5678"
            leftIcon={<Phone className="h-5 w-5" />}
          />

          <Input
            {...register('direccion')}
            label="Dirección (opcional)"
            placeholder="Calle principal, San José"
            leftIcon={<MapPin className="h-5 w-5" />}
          />

          <Select
            {...register('rolId', { valueAsNumber: true })}
            label="Rol *"
            options={rolOptions}
            placeholder="Selecciona un rol"
            error={errors.rolId?.message}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingUsuario ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDelete(showDeleteConfirm!)}
        title="¿Eliminar usuario?"
        message="Esta acción eliminará el usuario permanentemente. ¿Deseas continuar?"
        variant="danger"
        confirmText="Eliminar"
      />
    </div>
  );
};