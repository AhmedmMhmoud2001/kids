import React, { useState, useEffect } from 'react';
import { useApp } from '../context/useApp';
import { User, Mail, Shield, Calendar, Save, Loader, Camera } from 'lucide-react';
import { updateUser } from '../api/users';
import { uploadImage, uploadUserImage } from '../api/upload';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';
import { parseLocalizedField, buildLocalizedField } from '../utils/localizedField';

const Profile = () => {
    const { t } = useLanguage();
    const { user, login } = useApp();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        firstNameEn: '',
        firstNameAr: '',
        lastNameEn: '',
        lastNameAr: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        image: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (user) {
            const firstName = parseLocalizedField(user.firstName || '');
            const lastName = parseLocalizedField(user.lastName || '');
            setFormData(prev => ({
                ...prev,
                firstNameEn: firstName.en,
                firstNameAr: firstName.ar,
                lastNameEn: lastName.en,
                lastNameAr: lastName.ar,
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                country: user.country || '',
                image: user.image || '',
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const result = await uploadUserImage(file);
            setFormData(prev => ({ ...prev, image: result.url }));
        } catch (err) {
            setMessage({ type: 'error', text: t(tx('Failed to upload image', 'فشل رفع الصورة')) });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: t(tx('New passwords do not match', 'كلمتا المرور الجديدتان غير متطابقتين')) });
            return;
        }
        if ((formData.firstNameEn.trim() || formData.firstNameAr.trim()) && (!formData.firstNameEn.trim() || !formData.firstNameAr.trim())) {
            setMessage({ type: 'error', text: t(tx('First name must be entered in both English and Arabic', 'الاسم الأول يجب إدخاله بالإنجليزية والعربية')) });
            return;
        }
        if ((formData.lastNameEn.trim() || formData.lastNameAr.trim()) && (!formData.lastNameEn.trim() || !formData.lastNameAr.trim())) {
            setMessage({ type: 'error', text: t(tx('Last name must be entered in both English and Arabic', 'اسم العائلة يجب إدخاله بالإنجليزية والعربية')) });
            return;
        }

        setLoading(true);

        try {
            const updateData = {
                firstName: buildLocalizedField(formData.firstNameEn, formData.firstNameAr),
                lastName: buildLocalizedField(formData.lastNameEn, formData.lastNameAr),
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                country: formData.country,
                image: formData.image
            };

            if (formData.newPassword) {
                updateData.password = formData.newPassword;
                // Ideally we should verify current password here, but that requires a different endpoint
                // or sending it to the backend to verify before update.
                // For simplicity, we assume admin/user can reset directly or backend handles policy.
            }

            const response = await updateUser(user.id, updateData);

            if (response.success) {
                // Update local context
                login(response.data);
                setMessage({ type: 'success', text: t(tx('Profile updated successfully', 'تم تحديث الملف الشخصي بنجاح')) });
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || t(tx('Failed to update profile', 'فشل تحديث الملف الشخصي')) });
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'SYSTEM_ADMIN': return 'bg-red-100 text-red-800';
            case 'ADMIN_KIDS': return 'bg-blue-100 text-blue-800';
            case 'ADMIN_NEXT': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{t(tx('Profile Settings', 'إعدادات الملف الشخصي'))}</h1>
                <p className="text-gray-600 mt-1">{t(tx('Manage your account settings and preferences', 'إدارة إعدادات حسابك وتفضيلاتك'))}</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-lg border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Info Card */}
                <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
                    <div className="text-center">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mx-auto border-4 border-white shadow-md">
                                {formData.image ? (
                                    <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-3xl font-bold">
                                        {(t(user?.firstName) || user?.email || '')?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                                {uploading ? <Loader size={14} className="animate-spin" /> : <Camera size={14} />}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-gray-900">
                            {t(user?.firstName)} {t(user?.lastName)}
                        </h2>
                        <p className="text-gray-600 text-sm">{user?.email}</p>
                        <div className="mt-3">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user?.role)}`}>
                                {user?.role?.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3 pt-6 border-t">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Mail size={16} />
                            <span>{user?.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Shield size={16} />
                            <span>{t(tx('Role', 'الدور'))}: {user?.role?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Calendar size={16} />
                            <span>{t(tx('Joined', 'تاريخ الانضمام'))}: {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">{t(tx('Edit Profile', 'تعديل الملف الشخصي'))}</h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                                <User size={16} /> {t(tx('Personal Information', 'المعلومات الشخصية'))}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        name="firstNameEn"
                                        value={formData.firstNameEn}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name (Arabic)</label>
                                    <input
                                        type="text"
                                        name="firstNameAr"
                                        value={formData.firstNameAr}
                                        onChange={handleChange}
                                        dir="rtl"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name (English)</label>
                                    <input
                                        type="text"
                                        name="lastNameEn"
                                        value={formData.lastNameEn}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name (Arabic)</label>
                                    <input
                                        type="text"
                                        name="lastNameAr"
                                        value={formData.lastNameAr}
                                        onChange={handleChange}
                                        dir="rtl"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="border-t pt-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                                <Shield size={16} /> Address Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div className="border-t pt-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                                <Shield size={16} /> Security
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Leave blank to keep current"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6 border-t">
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
