import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';
import {
    fetchRbacRoles,
    fetchRbacPermissions,
    createRbacRole,
    updateRbacRole,
    deleteRbacRole
} from '../api/rbac';

const EMPTY_ROLE_FORM = {
    key: '',
    name: '',
    description: '',
    permissionKeys: []
};

const getRolePermissionKeys = (role) => (role?.permissions || [])
    .map((rp) => rp?.permission?.key)
    .filter(Boolean);

const Rbac = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [roleForm, setRoleForm] = useState(EMPTY_ROLE_FORM);
    const [detailsPermissionKeys, setDetailsPermissionKeys] = useState([]);

    const selectedRole = useMemo(
        () => roles.find((role) => role.id === selectedRoleId) || null,
        [roles, selectedRoleId]
    );

    const groupedPermissions = useMemo(() => {
        const map = {};
        for (const p of permissions) {
            const moduleName = p.module || 'general';
            if (!map[moduleName]) map[moduleName] = [];
            map[moduleName].push(p);
        }
        return map;
    }, [permissions]);

    const loadData = async (preferredRoleId = '') => {
        setLoading(true);
        setError(null);
        try {
            const [rolesRes, permissionsRes] = await Promise.all([
                fetchRbacRoles(),
                fetchRbacPermissions()
            ]);
            const nextRoles = rolesRes?.data || [];
            const nextPermissions = permissionsRes?.data || [];
            setRoles(nextRoles);
            setPermissions(nextPermissions);

            const targetId = preferredRoleId || selectedRoleId;
            const exists = targetId && nextRoles.some((role) => role.id === targetId);
            if (exists) {
                setSelectedRoleId(targetId);
            } else if (nextRoles.length > 0) {
                setSelectedRoleId(nextRoles[0].id);
            } else {
                setSelectedRoleId('');
            }
        } catch (err) {
            setError(err.message || 'Failed to load RBAC data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedRole) {
            setDetailsPermissionKeys([]);
            return;
        }
        setDetailsPermissionKeys(getRolePermissionKeys(selectedRole));
    }, [selectedRole]);

    const openCreateRole = () => {
        setEditingRoleId(null);
        setRoleForm(EMPTY_ROLE_FORM);
        setIsRoleModalOpen(true);
    };

    const openRoleDetails = (roleId) => {
        setSelectedRoleId(roleId);
        setIsDetailsModalOpen(true);
    };

    const openEditRole = (role) => {
        setEditingRoleId(role.id);
        setRoleForm({
            key: role.key || '',
            name: role.name || '',
            description: role.description || '',
            permissionKeys: getRolePermissionKeys(role)
        });
        setIsRoleModalOpen(true);
    };

    const toggleRoleFormPermission = (key, checked) => {
        setRoleForm((prev) => ({
            ...prev,
            permissionKeys: checked
                ? Array.from(new Set([...prev.permissionKeys, key]))
                : prev.permissionKeys.filter((k) => k !== key)
        }));
    };

    const toggleDetailsPermission = (key, checked) => {
        setDetailsPermissionKeys((prev) => (
            checked
                ? Array.from(new Set([...prev, key]))
                : prev.filter((k) => k !== key)
        ));
    };

    const handleSaveRoleForm = async () => {
        if (!roleForm.name.trim()) {
            setError(t(tx('Role name is required.', 'اسم الدور مطلوب.')));
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);
        try {
            let savedRole = null;
            if (editingRoleId) {
                const res = await updateRbacRole(editingRoleId, {
                    name: roleForm.name.trim(),
                    description: roleForm.description.trim(),
                    permissionKeys: roleForm.permissionKeys
                });
                savedRole = res?.data || null;
                setMessage(t(tx('Role updated successfully.', 'تم تحديث الدور بنجاح.')));
            } else {
                if (!roleForm.key.trim()) {
                    throw new Error(t(tx('Role key is required.', 'مفتاح الدور مطلوب.')));
                }
                const res = await createRbacRole({
                    key: roleForm.key.trim(),
                    name: roleForm.name.trim(),
                    description: roleForm.description.trim(),
                    permissionKeys: roleForm.permissionKeys
                });
                savedRole = res?.data || null;
                setMessage(t(tx('Role created successfully.', 'تم إنشاء الدور بنجاح.')));
            }

            setIsRoleModalOpen(false);
            setEditingRoleId(null);
            setRoleForm(EMPTY_ROLE_FORM);
            await loadData(savedRole?.id || selectedRoleId);
        } catch (err) {
            setError(err.message || 'Failed to save role');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRole = async (role) => {
        if (!window.confirm(t(tx(`Delete role "${role.name}"?`, `حذف الدور "${role.name}"؟`)))) return;
        setSaving(true);
        setError(null);
        setMessage(null);
        try {
            await deleteRbacRole(role.id);
            setMessage(t(tx('Role deleted successfully.', 'تم حذف الدور بنجاح.')));
            await loadData();
        } catch (err) {
            setError(err.message || 'Failed to delete role');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDetailsPermissions = async () => {
        if (!selectedRole) return;
        setSaving(true);
        setError(null);
        setMessage(null);
        try {
            await updateRbacRole(selectedRole.id, {
                permissionKeys: detailsPermissionKeys
            });
            setMessage(t(tx('Role permissions updated successfully.', 'تم تحديث صلاحيات الدور بنجاح.')));
            await loadData(selectedRole.id);
        } catch (err) {
            setError(err.message || 'Failed to update role permissions');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6">{t(tx('Loading roles...', 'جار تحميل الأدوار...'))}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t(tx('RBAC Roles', 'أدوار RBAC'))}</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        {t(tx('Manage roles, permissions, and linked users.', 'إدارة الأدوار والصلاحيات والمستخدمين المرتبطين.'))}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreateRole}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                    {t(tx('Add Role', 'إضافة Role'))}
                </button>
            </div>

            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}
            {message && <div className="p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">{message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {roles.map((role) => {
                    const isSelected = selectedRoleId === role.id;
                    const permissionCount = (role.permissions || []).length;
                    const userCount = (role.users || []).length;
                    return (
                        <div
                            key={role.id}
                            className={`rounded-2xl border p-0 bg-white shadow-sm overflow-hidden transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-100 shadow-blue-100/60' : 'border-gray-100 hover:shadow-md hover:border-gray-200'}`}
                        >
                            <div className="bg-linear-to-r from-slate-50 to-blue-50 border-b border-gray-100 px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">{role.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{role.key}</p>
                                    </div>
                                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${role.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {role.isActive ? t(tx('Active', 'نشط')) : t(tx('Inactive', 'غير نشط'))}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                {role.description && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[40px]">{role.description}</p>
                                )}
                                {!role.description && (
                                    <p className="text-sm text-gray-400 mb-3 min-h-[40px]">{t(tx('No description', 'بدون وصف'))}</p>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg bg-blue-50 px-3 py-2 border border-blue-100">
                                        <p className="text-[11px] text-blue-700">{t(tx('Permissions', 'الصلاحيات'))}</p>
                                        <p className="text-base font-semibold text-blue-900">{permissionCount}</p>
                                    </div>
                                    <div className="rounded-lg bg-violet-50 px-3 py-2 border border-violet-100">
                                        <p className="text-[11px] text-violet-700">{t(tx('Users', 'المستخدمون'))}</p>
                                        <p className="text-base font-semibold text-violet-900">{userCount}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 pb-4 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openRoleDetails(role.id)}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                                >
                                    {t(tx('Details', 'تفاصيل'))}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openEditRole(role)}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                                >
                                    {t(tx('Edit', 'تعديل'))}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteRole(role)}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                >
                                    {t(tx('Delete', 'حذف'))}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedRole && isDetailsModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[92vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-linear-to-r from-slate-50 to-blue-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {t(tx('Role Details', 'تفاصيل الدور'))}: {selectedRole.name}
                                </h2>
                                <p className="text-sm text-gray-600">{selectedRole.key}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openEditRole(selectedRole)}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                                >
                                    {t(tx('Edit Role Info', 'تعديل بيانات الدور'))}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                                >
                                    {t(tx('Close', 'إغلاق'))}
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(92vh-74px)] space-y-5">
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                <div className="xl:col-span-2 rounded-xl border border-gray-200 p-4">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-2">{t(tx('Current Permissions', 'الصلاحيات الحالية'))}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {getRolePermissionKeys(selectedRole).length === 0 ? (
                                            <span className="text-sm text-gray-500">{t(tx('No permissions assigned.', 'لا توجد صلاحيات.'))}</span>
                                        ) : (
                                            getRolePermissionKeys(selectedRole).map((key) => (
                                                <span key={key} className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">{key}</span>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-4">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-2">{t(tx('Users Linked To This Role', 'المستخدمون المرتبطون بهذا الدور'))}</h3>
                                    {(selectedRole.users || []).length === 0 ? (
                                        <p className="text-sm text-gray-500">{t(tx('No users linked to this role yet.', 'لا يوجد مستخدمون مرتبطون بهذا الدور حتى الآن.'))}</p>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-auto">
                                            {selectedRole.users.map((userRole) => {
                                                const user = userRole.user;
                                                const fullName = [t(user?.firstName || ''), t(user?.lastName || '')].filter(Boolean).join(' ').trim();
                                                return (
                                                    <div key={userRole.id} className="border border-gray-100 rounded-lg px-3 py-2">
                                                        <p className="text-sm font-medium text-gray-800">{fullName || user?.email || '-'}</p>
                                                        <p className="text-xs text-gray-500">{user?.email || '-'}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border rounded-xl border-gray-200 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                    <h3 className="text-sm font-semibold text-gray-800">{t(tx('Manage Role Permissions', 'إدارة صلاحيات الدور'))}</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDetailsPermissionKeys(getRolePermissionKeys(selectedRole))}
                                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                                            disabled={saving}
                                        >
                                            {t(tx('Reset', 'إعادة تعيين'))}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveDetailsPermissions}
                                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                                            disabled={saving}
                                        >
                                            {saving ? t(tx('Saving...', 'جار الحفظ...')) : t(tx('Save Permissions', 'حفظ الصلاحيات'))}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {Object.entries(groupedPermissions).map(([moduleName, list]) => (
                                        <div key={moduleName} className="rounded-lg border border-gray-100 p-3 bg-gray-50/40">
                                            <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-600 mb-2">{moduleName}</h4>
                                            <div className="space-y-2">
                                                {list.map((p) => (
                                                    <label key={`${selectedRole.id}-${p.id}`} className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={detailsPermissionKeys.includes(p.key)}
                                                            onChange={(e) => toggleDetailsPermission(p.key, e.target.checked)}
                                                        />
                                                        <span>{p.key}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isRoleModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200 p-5 space-y-4 max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editingRoleId ? t(tx('Edit Role', 'تعديل Role')) : t(tx('Add Role', 'إضافة Role'))}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsRoleModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                {t(tx('Close', 'إغلاق'))}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {!editingRoleId && (
                                <input
                                    value={roleForm.key}
                                    onChange={(e) => setRoleForm((prev) => ({ ...prev, key: e.target.value }))}
                                    placeholder={t(tx('Role key (e.g. manager)', 'مفتاح الدور (مثال manager)'))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            )}
                            <input
                                value={roleForm.name}
                                onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder={t(tx('Role name', 'اسم الدور'))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <textarea
                                value={roleForm.description}
                                onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder={t(tx('Role description', 'وصف الدور'))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[90px]"
                            />
                        </div>

                        <div className="border rounded-lg border-gray-200 p-3">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">
                                {t(tx('Permissions', 'الصلاحيات'))}
                            </h3>
                            <div className="space-y-4 max-h-72 overflow-auto">
                                {Object.entries(groupedPermissions).map(([moduleName, list]) => (
                                    <div key={`modal-${moduleName}`}>
                                        <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">{moduleName}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {list.map((p) => (
                                                <label key={`role-form-${p.id}`} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleForm.permissionKeys.includes(p.key)}
                                                        onChange={(e) => toggleRoleFormPermission(p.key, e.target.checked)}
                                                    />
                                                    <span>{p.key}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsRoleModalOpen(false)}
                                className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                {t(tx('Cancel', 'إلغاء'))}
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveRoleForm}
                                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                                disabled={saving}
                            >
                                {saving ? t(tx('Saving...', 'جار الحفظ...')) : editingRoleId ? t(tx('Update Role', 'تحديث الدور')) : t(tx('Create Role', 'إنشاء الدور'))}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rbac;
