import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User, X, Loader, Shield } from 'lucide-react';
import { fetchUsers, createUser, updateUser, deleteUser } from '../api/users';
import { fetchRbacRoles, fetchUserRbacProfile, assignUserRoles } from '../api/rbac';
import { uploadImage } from '../api/upload';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { tx } from '../i18n/text';
import { parseLocalizedField, buildLocalizedField } from '../utils/localizedField';

const Users = () => {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const [users, setUsers] = useState([]);
    const [rbacRoles, setRbacRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'CUSTOMER',
        firstName: '',
        lastName: '',
        firstNameEn: '',
        firstNameAr: '',
        lastNameEn: '',
        lastNameAr: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        image: '',
        rbacRoleId: ''
    });

    useEffect(() => {
        loadUsers();
        loadRbacRoles();
    }, []);

    const LEGACY_ROLE_TO_RBAC_ROLE_KEY = {
        SYSTEM_ADMIN: 'admin',
        ADMIN_KIDS: 'manager',
        ADMIN_NEXT: 'manager',
        SELLER: 'employee'
    };

    const getDefaultRbacRoleIdForLegacyRole = (legacyRole) => {
        const key = LEGACY_ROLE_TO_RBAC_ROLE_KEY[legacyRole];
        if (!key) return '';
        const role = rbacRoles.find((r) => r.key === key);
        return role?.id || '';
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await fetchUsers();
            if (response.success) {
                setUsers(response.data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadRbacRoles = async () => {
        try {
            const response = await fetchRbacRoles();
            if (response.success) {
                setRbacRoles(response.data || []);
            }
        } catch {
            setRbacRoles([]);
        }
    };

    const handleOpenModal = (mode, user = null) => {
        setModalMode(mode);
        setSelectedUser(user);
        if (mode === 'edit' && user) {
            const firstName = parseLocalizedField(user.firstName || '');
            const lastName = parseLocalizedField(user.lastName || '');
            setFormData({
                email: user.email,
                password: '', // Don't show password
                role: user.role,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                firstNameEn: firstName.en,
                firstNameAr: firstName.ar,
                lastNameEn: lastName.en,
                lastNameAr: lastName.ar,
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                country: user.country || '',
                image: user.image || '',
                rbacRoleId: getDefaultRbacRoleIdForLegacyRole(user.role)
            });
            fetchUserRbacProfile(user.id)
                .then((res) => {
                    const assignedRoleId = res?.data?.user?.userRoles?.[0]?.roleId || '';
                    if (assignedRoleId) {
                        setFormData((prev) => ({ ...prev, rbacRoleId: assignedRoleId }));
                    }
                })
                .catch(() => {});
        } else {
            setFormData({
                email: '',
                password: '',
                role: 'CUSTOMER',
                firstName: '',
                lastName: '',
                firstNameEn: '',
                firstNameAr: '',
                lastNameEn: '',
                lastNameAr: '',
                phone: '',
                address: '',
                city: '',
                country: '',
                image: '',
                rbacRoleId: ''
            });
        }
        setIsModalOpen(true);
        setError(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        setError(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'role') {
                next.rbacRoleId = getDefaultRbacRoleIdForLegacyRole(value);
            }
            return next;
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const result = await uploadImage(file);
            setFormData(prev => ({ ...prev, image: result.url }));
        } catch (err) {
            alert(t(tx('Failed to upload image', 'فشل رفع الصورة')));
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setError(null);

        try {
            const hasFirstAny = formData.firstNameEn.trim() || formData.firstNameAr.trim();
            const hasLastAny = formData.lastNameEn.trim() || formData.lastNameAr.trim();
            if (hasFirstAny && (!formData.firstNameEn.trim() || !formData.firstNameAr.trim())) {
                throw new Error('First name must be entered in both English and Arabic');
            }
            if (hasLastAny && (!formData.lastNameEn.trim() || !formData.lastNameAr.trim())) {
                throw new Error('Last name must be entered in both English and Arabic');
            }

            const localizedPayload = {
                ...formData,
                firstName: (formData.firstNameEn.trim() || formData.firstNameAr.trim())
                    ? buildLocalizedField(formData.firstNameEn, formData.firstNameAr)
                    : '',
                lastName: (formData.lastNameEn.trim() || formData.lastNameAr.trim())
                    ? buildLocalizedField(formData.lastNameEn, formData.lastNameAr)
                    : ''
            };
            delete localizedPayload.firstNameEn;
            delete localizedPayload.firstNameAr;
            delete localizedPayload.lastNameEn;
            delete localizedPayload.lastNameAr;
            const selectedRbacRoleId = localizedPayload.rbacRoleId || '';
            delete localizedPayload.rbacRoleId;

            if (modalMode === 'create') {
                const response = await createUser(localizedPayload);
                if (response.success) {
                    const createdUserId = response?.data?.id;
                    if (createdUserId) {
                        await assignUserRoles(createdUserId, selectedRbacRoleId ? [selectedRbacRoleId] : []);
                    }
                    loadUsers();
                    handleCloseModal();
                }
            } else {
                const updateData = { ...localizedPayload };
                if (!updateData.password) delete updateData.password; // Don't send empty password

                const response = await updateUser(selectedUser.id, updateData);
                if (response.success) {
                    await assignUserRoles(selectedUser.id, selectedRbacRoleId ? [selectedRbacRoleId] : []);
                    loadUsers();
                    handleCloseModal();
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t(tx('Are you sure you want to delete this user? This action cannot be undone.', 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.')))) {
            try {
                await deleteUser(id);
                setUsers(users.filter(u => u.id !== id));
            } catch (err) {
                alert(`${t(tx('Failed to delete user', 'فشل حذف المستخدم'))}: ${err.message}`);
            }
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'SYSTEM_ADMIN': return 'bg-red-100 text-red-800';
            case 'ADMIN_KIDS': return 'bg-blue-100 text-blue-800';
            case 'ADMIN_NEXT': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const LEGACY_ROLE_TO_RBAC_ROLE = {
        SYSTEM_ADMIN: 'admin',
        ADMIN_KIDS: 'manager',
        ADMIN_NEXT: 'manager',
        SELLER: 'employee'
    };

    const getMappedRbacRole = (role) => LEGACY_ROLE_TO_RBAC_ROLE[String(role || '').trim()] || null;

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{t(tx('User Management', 'إدارة المستخدمين'))}</h1>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">{t(tx('Manage system users, customer accounts, and roles', 'إدارة مستخدمي النظام وحسابات العملاء والأدوار'))}</p>
                </div>
                <button
                    onClick={() => handleOpenModal('create')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shadow-md text-sm md:text-base font-medium active:scale-95"
                >
                    <Plus size={20} />
                    {t(tx('Add User', 'إضافة مستخدم'))}
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={t(tx('Search users by name or email...', 'ابحث عن مستخدم بالاسم أو البريد الإلكتروني...'))}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 -mx-3 sm:mx-0">
                {/* Scroll hint for mobile */}
                <div className="sm:hidden px-3 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-600 font-medium flex items-center justify-center gap-2">
                    <span>←</span> {t(tx('Swipe to see more', 'اسحب لرؤية المزيد'))} <span>→</span>
                </div>
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full" style={{ minWidth: '700px' }}>
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(tx('User', 'المستخدم'))}</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(tx('Role', 'الدور'))}</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(tx('Contact', 'التواصل'))}</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(tx('Location', 'الموقع'))}</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(tx('Joined', 'تاريخ الانضمام'))}</th>
                                <th className="px-3 sm:px-6 py-3 text-right text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(tx('Actions', 'الإجراءات'))}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                        <Loader className="animate-spin mx-auto h-8 w-8 mb-2" />
                                        {t(tx('Loading users...', 'جاري تحميل المستخدمين...'))}
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                        {t(tx('No users found', 'لا يوجد مستخدمون'))}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className={`hover:${isDark ? 'bg-slate-800' : 'bg-gray-50'} transition-colors`}>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                                    {user.image ? (
                                                        <img className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover" src={user.image} alt="" />
                                                    ) : (
                                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs sm:text-sm">
                                                            {(t(user.firstName) || user.email || 'U')[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-2 sm:ml-4">
                                                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                                                        {t(user.firstName)} {t(user.lastName)}
                                                    </div>
                                                    <div className="text-[10px] sm:text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2 py-1 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                                {getMappedRbacRole(user.role) && (
                                                    <span className="px-2 py-1 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                                        {`RBAC: ${getMappedRbacRole(user.role)}`}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                            {user.phone || '-'}
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                            {user.city ? `${user.city}, ${user.country}` : '-'}
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenModal('edit', user)}
                                                className="text-blue-600 hover:text-blue-900 mr-2 sm:mr-4 p-1"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-600 hover:text-red-900 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-bold text-gray-900">
                                {modalMode === 'create' ? 'Add New User' : 'Edit User'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {error && (
                            <div className="mx-6 mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Profile Image */}
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 rounded-full bg-gray-100 overflow-hidden relative group">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                            <User size={32} />
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <Loader className="animate-spin text-white" size={20} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                                        Change Photo
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max 5MB.</p>
                                </div>
                            </div>

                            {/* Account Info */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <Shield size={16} />
                                    Account Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {modalMode === 'create' ? 'Password *' : 'New Password (Optional)'}
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required={modalMode === 'create'}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : ''}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="CUSTOMER">Customer</option>
                                            <option value="SYSTEM_ADMIN">System Admin</option>
                                            <option value="ADMIN_KIDS">Admin Kids</option>
                                            <option value="ADMIN_NEXT">Admin Next</option>
                                            <option value="SELLER">Seller</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t(tx('RBAC Role', 'دور RBAC'))}
                                        </label>
                                        <select
                                            name="rbacRoleId"
                                            value={formData.rbacRoleId}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">{t(tx('No RBAC role', 'بدون دور RBAC'))}</option>
                                            {rbacRoles.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name} ({r.key})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Details */}
                            <div className="border-t pt-6">
                                <h3 className="text-sm font-medium text-gray-900 mb-4">Personal Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name (English)</label>
                                        <input
                                            type="text"
                                            name="firstNameEn"
                                            value={formData.firstNameEn}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name (Arabic)</label>
                                        <input
                                            type="text"
                                            name="firstNameAr"
                                            value={formData.firstNameAr}
                                            onChange={handleInputChange}
                                            dir="rtl"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name (English)</label>
                                        <input
                                            type="text"
                                            name="lastNameEn"
                                            value={formData.lastNameEn}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name (Arabic)</label>
                                        <input
                                            type="text"
                                            name="lastNameAr"
                                            value={formData.lastNameAr}
                                            onChange={handleInputChange}
                                            dir="rtl"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalLoading || uploading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {modalLoading && <Loader className="animate-spin" size={16} />}
                                    {modalMode === 'create' ? 'Create User' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
