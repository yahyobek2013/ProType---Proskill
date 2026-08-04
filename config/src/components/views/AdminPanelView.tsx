import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Competition, SystemStats, SystemText, TextCategory, TextLanguage, CertificatePolicy } from '../../types';
import { getUserAvatar } from '../../utils/imageUtils';
import {
  ShieldAlert,
  Users,
  Trophy,
  BarChart3,
  Edit,
  Trash2,
  ShieldCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Award,
  Crown,
  UserPlus,
  FileText,
  Eye,
  Globe,
  Clock,
  ToggleLeft,
  ToggleRight,
  Check,
  Lock,
  Sparkles,
  BookOpen
} from 'lucide-react';

const CATEGORY_NAMES: Record<TextCategory, string> = {
  mashq: "Mashq qilish",
  jang: "Jang",
  musobaqalar: "Musobaqalar",
  bosh_sahifa: "Bosh sahifa",
  profil: "Profil",
  sertifikat: "Sertifikat",
  tugmalar: "Tugmalar",
  xabarlar: "Xabarlar",
  barchasi: "Barcha kategoriyalar"
};

const LANGUAGE_NAMES: Record<TextLanguage, string> = {
  uz: "O'zbekcha (UZ)",
  en: "English (EN)",
  ru: "Русский (RU)"
};

export const AdminPanelView: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'competitions' | 'texts' | 'stats'>('users');

  // Admin Data State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [competitionsList, setCompetitionsList] = useState<Competition[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Admin Modal State
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [newAdminLogin, setNewAdminLogin] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminPassConfirm, setNewAdminPassConfirm] = useState('');
  const [newAdminIsm, setNewAdminIsm] = useState('');
  const [newAdminFamiliya, setNewAdminFamiliya] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Users Tab Search, Filter & Pagination State
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Delete User Dialog State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editIsm, setEditIsm] = useState('');
  const [editFamiliya, setEditFamiliya] = useState('');
  const [editLogin, setEditLogin] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editWpmMax, setEditWpmMax] = useState(0);

  // Create / Edit Competition State
  const [isCreateCompOpen, setIsCreateCompOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [compTitle, setCompTitle] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compReward, setCompReward] = useState(300);
  const [compDuration, setCompDuration] = useState<number>(60); // 15, 30, 60, 120, 300
  const [compCertPolicy, setCompCertPolicy] = useState<CertificatePolicy>('none');
  const [selectedCompTexts, setSelectedCompTexts] = useState<SystemText[]>([]);
  const [editCompStatus, setEditCompStatus] = useState<'active' | 'upcoming' | 'finished'>('active');

  // Competition Text Picker State inside Modal
  const [allPracticeTexts, setAllPracticeTexts] = useState<SystemText[]>([]);
  const [modalTextSearch, setModalTextSearch] = useState('');
  const [modalTextLang, setModalTextLang] = useState<string>('all');
  const [modalTextCat, setModalTextCat] = useState<string>('barchasi');
  const [modalPreviewText, setModalPreviewText] = useState<SystemText | null>(null);
  const [isLoadingPracticeTexts, setIsLoadingPracticeTexts] = useState(false);

  // Delete Competition Dialog State
  const [deletingComp, setDeletingComp] = useState<Competition | null>(null);

  // --- TEXTS MANAGEMENT STATE ---
  const [textsList, setTextsList] = useState<SystemText[]>([]);
  const [isTextsLoading, setIsTextsLoading] = useState(false);
  const [textCategoryFilter, setTextCategoryFilter] = useState<string>('barchasi');
  const [textLanguageFilter, setTextLanguageFilter] = useState<string>('all');
  const [textStatusFilter, setTextStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [textSearchQuery, setTextSearchQuery] = useState('');

  // Add / Edit Text Modal State
  const [isCreateTextOpen, setIsCreateTextOpen] = useState(false);
  const [editingText, setEditingText] = useState<SystemText | null>(null);

  const [textFormTitle, setTextFormTitle] = useState('');
  const [textFormContent, setTextFormContent] = useState('');
  const [textFormCategory, setTextFormCategory] = useState<TextCategory>('mashq');
  const [textFormLanguage, setTextFormLanguage] = useState<TextLanguage>('uz');
  const [textFormIsActive, setTextFormIsActive] = useState(true);
  const [isSavingText, setIsSavingText] = useState(false);

  // Preview & Delete Text Modal State
  const [previewingText, setPreviewingText] = useState<SystemText | null>(null);
  const [deletingText, setDeletingText] = useState<SystemText | null>(null);
  const [isDeletingTextLoading, setIsDeletingTextLoading] = useState(false);

  // Bulk Delete Text State
  const [selectedTextIds, setSelectedTextIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeletingLoading, setIsBulkDeletingLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'texts') {
      loadTextsData();
    }
  }, [user, activeTab, textCategoryFilter, textLanguageFilter, textStatusFilter, textSearchQuery]);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchUserQuery, roleFilter, pageSize]);

  const showNotify = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const headers = { 'x-admin-id': user?.id || '' };

      const [uRes, cRes, sRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/competitions'),
        fetch('/api/admin/stats', { headers })
      ]);

      if (uRes.ok) setUsersList(await uRes.json());
      if (cRes.ok) setCompetitionsList(await cRes.json());
      if (sRes.ok) setStats(await sRes.json());
      
      if (activeTab === 'texts') {
        await loadTextsData();
      }
    } catch (err) {
      console.error("Load admin data error:", err);
      showNotify('error', "Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  // --- TEXTS DATA LOADER & CRUD ---
  const loadTextsData = async () => {
    if (!user) return;
    setIsTextsLoading(true);
    try {
      const params = new URLSearchParams();
      if (textCategoryFilter !== 'barchasi') params.append('category', textCategoryFilter);
      if (textLanguageFilter !== 'all') params.append('language', textLanguageFilter);
      if (textStatusFilter !== 'all') params.append('status', textStatusFilter);
      if (textSearchQuery.trim()) params.append('search', textSearchQuery.trim());

      const res = await fetch(`/api/admin/texts?${params.toString()}`, {
        headers: { 'x-admin-id': user.id }
      });
      if (res.ok) {
        setTextsList(await res.json());
      }
    } catch (err) {
      console.error("Load texts error:", err);
    } finally {
      setIsTextsLoading(false);
    }
  };

  const handleOpenCreateAdmin = () => {
    setNewAdminLogin('');
    setNewAdminPass('');
    setNewAdminPassConfirm('');
    setNewAdminIsm('');
    setNewAdminFamiliya('');
    setIsCreateAdminOpen(true);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newAdminLogin.trim()) {
      showNotify('error', "Administrator loginini kiriting!");
      return;
    }

    if (!newAdminPass || newAdminPass.length < 3) {
      showNotify('error', "Parol kamida 3 ta belgidan iborat bo'lishi kerak!");
      return;
    }

    if (newAdminPass !== newAdminPassConfirm) {
      showNotify('error', "Kiritilgan parollar bir-biriga mos kelmadi!");
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify({
          login: newAdminLogin,
          password: newAdminPass,
          passwordConfirm: newAdminPassConfirm,
          ism: newAdminIsm,
          familiya: newAdminFamiliya
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotify('success', data.message || "Yangi administrator muvaffaqiyatli qo'shildi.");
        setIsCreateAdminOpen(false);
        await loadAdminData();
      } else {
        showNotify('error', data.error || "Administrator qo'shishda xatolik yuz berdi");
      }
    } catch (err) {
      showNotify('error', "Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleOpenCreateText = () => {
    setEditingText(null);
    setTextFormTitle('');
    setTextFormContent('');
    setTextFormCategory('mashq');
    setTextFormLanguage('uz');
    setTextFormIsActive(true);
    setIsCreateTextOpen(true);
  };

  const handleOpenEditText = (item: SystemText) => {
    setEditingText(item);
    setTextFormTitle(item.title);
    setTextFormContent(item.content);
    setTextFormCategory(item.category);
    setTextFormLanguage(item.language);
    setTextFormIsActive(item.is_active);
    setIsCreateTextOpen(true);
  };

  const handleSaveText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !textFormTitle.trim() || !textFormContent.trim()) {
      showNotify('error', "Sarlavha va matn mazmunini kiriting!");
      return;
    }

    setIsSavingText(true);
    try {
      const url = editingText ? `/api/admin/texts/${editingText.id}` : '/api/admin/texts';
      const method = editingText ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify({
          title: textFormTitle,
          content: textFormContent,
          category: textFormCategory,
          language: textFormLanguage,
          is_active: textFormIsActive
        })
      });

      const data = await res.json();
      if (res.ok) {
        showNotify('success', data.message || "Matn muvaffaqiyatli saqlandi.");
        setIsCreateTextOpen(false);
        await loadTextsData();
      } else {
        showNotify('error', data.error || "Matnni saqlashda xatolik");
      }
    } catch (err) {
      showNotify('error', "Server bilan bog'lanishda xatolik");
    } finally {
      setIsSavingText(false);
    }
  };

  const handleToggleTextStatus = async (item: SystemText) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/texts/${item.id}/toggle`, {
        method: 'PATCH',
        headers: { 'x-admin-id': user.id }
      });
      if (res.ok) {
        const data = await res.json();
        showNotify('success', data.message);
        await loadTextsData();
      } else {
        showNotify('error', "Holatni o'zgartirishda xatolik");
      }
    } catch (err) {
      showNotify('error', "Server xatoligi");
    }
  };

  // Selection and Bulk Actions
  const handleToggleSelectText = (textId: string) => {
    setSelectedTextIds(prev =>
      prev.includes(textId) ? prev.filter(id => id !== textId) : [...prev, textId]
    );
  };

  const handleSelectAllTexts = () => {
    const visibleIds = textsList.map(t => t.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedTextIds.includes(id));
    if (allSelected) {
      setSelectedTextIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedTextIds, ...visibleIds]));
      setSelectedTextIds(merged);
    }
  };

  const handleClearSelection = () => {
    setSelectedTextIds([]);
  };

  const handleConfirmDeleteText = async () => {
    if (!deletingText || !user) return;
    setIsDeletingTextLoading(true);
    try {
      const res = await fetch(`/api/admin/texts/${deletingText.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-id': user.id }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const msg = data.message + (data.warning ? ` (${data.warning})` : '');
        showNotify('success', msg);
        setSelectedTextIds(prev => prev.filter(id => id !== deletingText.id));
        setDeletingText(null);
        await loadTextsData();
        await loadAdminData();
      } else {
        showNotify('error', data.error || "O'chirishda xatolik");
      }
    } catch (err) {
      showNotify('error', "Server bilan bog'lanishda xatolik");
    } finally {
      setIsDeletingTextLoading(false);
    }
  };

  const handleConfirmBulkDeleteTexts = async () => {
    if (selectedTextIds.length === 0 || !user) return;
    setIsBulkDeletingLoading(true);
    try {
      const res = await fetch('/api/admin/texts/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify({ ids: selectedTextIds })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotify('success', data.message || `${selectedTextIds.length} ta matn muvaffaqiyatli o'chirildi.`);
        setSelectedTextIds([]);
        setIsBulkDeleteModalOpen(false);
        await loadTextsData();
        await loadAdminData();
      } else {
        showNotify('error', data.error || "O'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      showNotify('error', "Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setIsBulkDeletingLoading(false);
    }
  };


  // --- USER ACTIONS ---

  // Open Delete User Dialog
  const handleOpenDeleteUser = (u: User) => {
    if (u.id === user?.id) {
      showNotify('error', "O'z hisobingizni o'chira olmaysiz!");
      return;
    }
    setDeletingUser(u);
  };

  // Confirm Delete User Action
  const handleConfirmDeleteUser = async () => {
    if (!deletingUser || !user) return;
    setIsDeletingLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-id': user.id }
      });

      if (res.ok) {
        showNotify('success', "Foydalanuvchi muvaffaqiyatli o'chirildi.");
        setDeletingUser(null);
        await loadAdminData();
      } else {
        const err = await res.json();
        showNotify('error', err.error || "O'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      showNotify('error', "Server bilan bog'lanishda xatolik");
    } finally {
      setIsDeletingLoading(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditIsm(u.ism);
    setEditFamiliya(u.familiya);
    setEditLogin(u.login);
    setEditRole(u.role);
    setEditWpmMax(u.wpm_max || 0);
  };

  // Save Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !user) return;

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify({
          ism: editIsm,
          familiya: editFamiliya,
          login: editLogin,
          role: editRole,
          wpm_max: editWpmMax
        })
      });

      if (res.ok) {
        showNotify('success', "Foydalanuvchi ma'lumotlari muvaffaqiyatli yangilandi!");
        setEditingUser(null);
        await loadAdminData();
      } else {
        const err = await res.json();
        showNotify('error', err.error || "Xatolik yuz berdi");
      }
    } catch (err) {
      showNotify('error', "Server bilan bog'lanishda xatolik");
    }
  };

  // Toggle Admin Role
  const handleToggleAdmin = async (targetUser: User) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/promote`, {
        method: 'POST',
        headers: { 'x-admin-id': user.id }
      });
      if (res.ok) {
        showNotify('success', `Foydalanuvchi roli (${targetUser.role === 'admin' ? 'Foydalanuvchi' : 'Administrator'}) ga o'zgartirildi!`);
        await loadAdminData();
      } else {
        const err = await res.json();
        showNotify('error', err.error || "Rolni o'zgartirishda xatolik");
      }
    } catch (err) {
      showNotify('error', "Server bilan bog'lanishda xatolik");
    }
  };

  // --- COMPETITION ACTIONS ---

  const fetchAllPracticeTexts = async () => {
    if (!user) return;
    setIsLoadingPracticeTexts(true);
    try {
      const res = await fetch('/api/admin/texts', {
        headers: { 'x-admin-id': user.id }
      });
      if (res.ok) {
        const data = await res.json();
        setAllPracticeTexts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch practice texts error:", err);
    } finally {
      setIsLoadingPracticeTexts(false);
    }
  };

  const handleOpenCreateComp = async () => {
    setCompTitle('');
    setCompDesc('');
    setCompReward(300);
    setCompDuration(60);
    setCompCertPolicy('none');
    setSelectedCompTexts([]);
    setModalTextSearch('');
    setModalTextLang('all');
    setModalTextCat('barchasi');
    setIsCreateCompOpen(true);
    await fetchAllPracticeTexts();
  };

  const handleOpenEditComp = async (comp: Competition) => {
    setEditingComp(comp);
    setCompTitle(comp.title);
    setCompDesc(comp.description);
    setCompReward(comp.reward_points);
    setEditCompStatus(comp.status);
    setCompDuration(comp.duration || 60);
    setCompCertPolicy(comp.certificate_policy || 'none');
    setModalTextSearch('');
    setModalTextLang('all');
    setModalTextCat('barchasi');

    setIsLoadingPracticeTexts(true);
    try {
      const res = await fetch('/api/admin/texts', { headers: { 'x-admin-id': user?.id || '' } });
      if (res.ok) {
        const rawTexts = await res.json();
        const allTextsData: SystemText[] = Array.isArray(rawTexts) ? rawTexts : [];
        setAllPracticeTexts(allTextsData);

        if (comp.texts_pool && comp.texts_pool.length > 0) {
          const matchedPool = comp.texts_pool.map(tp => {
            const foundInDb = allTextsData.find(t => t.id === tp.id);
            if (foundInDb) return foundInDb;
            return {
              id: tp.id,
              title: tp.title || comp.title,
              content: tp.content,
              category: (tp.category || 'musobaqalar') as TextCategory,
              language: (tp.language || 'uz') as TextLanguage,
              is_active: true,
              created_at: '',
              updated_at: ''
            };
          });
          setSelectedCompTexts(matchedPool);
        } else if (comp.selected_text_ids && comp.selected_text_ids.length > 0) {
          const matched = allTextsData.filter(t => comp.selected_text_ids?.includes(t.id));
          setSelectedCompTexts(matched.length > 0 ? matched : [{
            id: 'txt_' + comp.id,
            title: comp.title,
            content: comp.text,
            category: 'musobaqalar' as TextCategory,
            language: 'uz' as TextLanguage,
            is_active: true,
            created_at: '',
            updated_at: ''
          }]);
        } else if (comp.text) {
          setSelectedCompTexts([{
            id: 'txt_' + comp.id,
            title: comp.title,
            content: comp.text,
            category: 'musobaqalar' as TextCategory,
            language: 'uz' as TextLanguage,
            is_active: true,
            created_at: '',
            updated_at: ''
          }]);
        } else {
          setSelectedCompTexts([]);
        }
      }
    } catch (err) {
      console.error("Error opening edit comp:", err);
    } finally {
      setIsLoadingPracticeTexts(false);
    }
  };

  const handleToggleSelectTextForComp = (textItem: SystemText) => {
    const exists = selectedCompTexts.some(t => t.id === textItem.id);
    if (exists) {
      setSelectedCompTexts(prev => prev.filter(t => t.id !== textItem.id));
    } else {
      setSelectedCompTexts(prev => [...prev, textItem]);
    }
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !compTitle.trim()) {
      showNotify('error', "Musobaqa sarlavhasini kiriting!");
      return;
    }

    if (selectedCompTexts.length === 0) {
      showNotify('error', "Musobaqa uchun kamida 1 ta matn tanlashingiz shart!");
      return;
    }

    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify({
          title: compTitle,
          description: compDesc,
          reward_points: compReward,
          duration: compDuration,
          certificate_policy: compCertPolicy,
          selected_text_ids: selectedCompTexts.map(t => t.id),
          texts_pool: selectedCompTexts.map(t => ({
            id: t.id,
            title: t.title,
            content: t.content,
            category: t.category,
            language: t.language
          })),
          duration_days: 7
        })
      });

      if (res.ok) {
        showNotify('success', "Yangi musobaqa muvaffaqiyatli e'lon qilindi!");
        setIsCreateCompOpen(false);
        setCompTitle('');
        setCompDesc('');
        setSelectedCompTexts([]);
        await loadAdminData();
      } else {
        const data = await res.json();
        showNotify('error', data.error || "Musobaqa yaratishda xatolik");
      }
    } catch (err) {
      showNotify('error', "Server bilan bog'lanishda xatolik");
    }
  };

  const handleSaveEditComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComp || !user) return;

    if (selectedCompTexts.length === 0) {
      showNotify('error', "Musobaqa uchun kamida 1 ta matn tanlang!");
      return;
    }

    try {
      const res = await fetch(`/api/admin/competitions/${editingComp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify({
          title: compTitle,
          description: compDesc,
          reward_points: compReward,
          status: editCompStatus,
          duration: compDuration,
          certificate_policy: compCertPolicy,
          selected_text_ids: selectedCompTexts.map(t => t.id),
          texts_pool: selectedCompTexts.map(t => ({
            id: t.id,
            title: t.title,
            content: t.content,
            category: t.category,
            language: t.language
          }))
        })
      });

      if (res.ok) {
        showNotify('success', "Musobaqa ma'lumotlari yangilandi!");
        setEditingComp(null);
        await loadAdminData();
      } else {
        const data = await res.json();
        showNotify('error', data.error || "Musobaqani saqlashda xatolik");
      }
    } catch (err) {
      showNotify('error', "Server xatoligi");
    }
  };

  const handleFinishCompetition = async (compValId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/competitions/${compValId}/finish`, {
        method: 'POST',
        headers: { 'x-admin-id': user.id }
      });
      if (res.ok) {
        showNotify('success', "Musobaqa muvaffaqiyatli yakunlandi!");
        await loadAdminData();
      }
    } catch (err) {
      showNotify('error', "Yakunlashda xatolik");
    }
  };

  const handleConfirmDeleteComp = async () => {
    if (!deletingComp || !user) return;
    try {
      const res = await fetch(`/api/admin/competitions/${deletingComp.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-id': user.id }
      });
      if (res.ok) {
        showNotify('success', "Musobaqa o'chirildi!");
        setDeletingComp(null);
        await loadAdminData();
      }
    } catch (err) {
      showNotify('error', "O'chirishda xatolik");
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="py-20 text-center text-rose-400 font-bold">
        Ruxsat etilmagan sahifa. Faqat administratorlar uchun!
      </div>
    );
  }

  // User Filtering & Pagination Computations
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = `${u.ism} ${u.familiya} ${u.login}`
      .toLowerCase()
      .includes(searchUserQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Toast Notification Alert */}
      {notification && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-xl transition-all ${
          notification.type === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Admin Panel Header */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-800/80 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 shadow-xl">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-bold mb-1">
              <span>Rasmiy Boshqaruv Paneli</span>
            </div>
            <h2 className="text-2xl font-black text-white font-display">Administrator Paneli</h2>
            <p className="text-xs text-slate-400">Foydalanuvchilar, musobaqalar va tizim statistikasi boshqaruvi</p>
          </div>
        </div>

        {/* Refresh & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-md disabled:opacity-50"
            title="Ma'lumotlarni yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'users' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Foydalanuvchilar ({usersList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('competitions')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'competitions' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Musobaqalar ({competitionsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('texts')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'texts' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Matnlar ({textsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'stats' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tizim Statistikasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4">
          {/* Search, Filter & Controls Bar */}
          <div className="p-6 border-b border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-display">Barcha Foydalanuvchilar Ro'yxati</h3>
              <p className="text-xs text-slate-400">Jami: {filteredUsers.length} ta a'zo mos keldi ({usersList.length} tadan)</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Add New Admin Button */}
              <button
                onClick={handleOpenCreateAdmin}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-950/50 flex items-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Yangi admin qo'shish</span>
              </button>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">

                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={e => setSearchUserQuery(e.target.value)}
                  placeholder="Ism, familiya yoki login..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {searchUserQuery && (
                  <button
                    onClick={() => setSearchUserQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 font-semibold mr-1">Roli:</span>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">Barchasi</option>
                  <option value="user" className="bg-slate-900 text-white">Foydalanuvchilar</option>
                  <option value="admin" className="bg-slate-900 text-white">Administratorlar</option>
                </select>
              </div>

              {/* Page Size Selection */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400 font-semibold">
                <span>Ko'rsatish:</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value={5} className="bg-slate-900">5 ta</option>
                  <option value={10} className="bg-slate-900">10 ta</option>
                  <option value={20} className="bg-slate-900">20 ta</option>
                  <option value={50} className="bg-slate-900">50 ta</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Foydalanuvchi</th>
                  <th className="p-4">Login</th>
                  <th className="p-4">Roli</th>
                  <th className="p-4">Max WPM</th>
                  <th className="p-4">Aniqlik</th>
                  <th className="p-4">Testlar</th>
                  <th className="p-4 text-center">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      Birorta ham foydalanuvchi topilmadi
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={getUserAvatar(u.avatar, u.login)}
                          alt={u.ism}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-800 ring-2 ring-slate-800"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm">{u.ism} {u.familiya}</span>
                            {u.role === 'admin' && (
                              <Crown className="w-3.5 h-3.5 text-amber-400" title="Administrator" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {u.id}</span>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-slate-300 font-semibold">@{u.login}</td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.role === 'admin' ? 'Administrator' : 'Foydalanuvchi'}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-bold text-cyan-400">{u.wpm_max || 0} WPM</td>

                      <td className="p-4 font-mono font-bold text-emerald-400">{u.accuracy_avg || 0}%</td>

                      <td className="p-4 font-mono text-slate-400">{u.tests_completed || 0} ta</td>

                      <td className="p-4 text-center space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-400 border border-indigo-800 transition-all shadow-sm"
                          title="Tahrirlash"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Toggle Role Button */}
                        <button
                          onClick={() => handleToggleAdmin(u)}
                          className="p-2 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-800 transition-all shadow-sm"
                          title={u.role === 'admin' ? "Adminlikni olib tashlash" : "Admin qilish"}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleOpenDeleteUser(u)}
                          disabled={u.id === user?.id}
                          className={`p-2 rounded-xl transition-all shadow-sm ${
                            u.id === user?.id
                              ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                              : 'bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800'
                          }`}
                          title={u.id === user?.id ? "O'z hisobingizni o'chira olmaysiz" : "O'chirish"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          {filteredUsers.length > 0 && (
            <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/50">
              <div className="text-xs text-slate-400">
                Ko'rsatilyapti: <span className="font-bold text-white">{startIndex + 1}</span> - <span className="font-bold text-white">{Math.min(startIndex + pageSize, filteredUsers.length)}</span> / <span className="font-bold text-amber-400">{filteredUsers.length}</span> ta foydalanuvchi
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPETITIONS TAB */}
      {activeTab === 'competitions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
            <div>
              <h3 className="text-lg font-bold text-white font-display">Musobaqalarni Boshqarish</h3>
              <p className="text-xs text-slate-400">Yangi musobaqalar yaratish, tahrirlash va yakunlash</p>
            </div>

            <button
              onClick={handleOpenCreateComp}
              className="px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Musobaqa Yaratish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {competitionsList.map(comp => (
              <div key={comp.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      comp.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {comp.status === 'active' ? 'Faol Musobaqa' : 'Yakunlangan'}
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>
                          {comp.certificate_policy === 'winner_only' ? "Sertifikat: 1-o'rin" :
                           comp.certificate_policy === 'top_3' ? "Sertifikat: Top 3" :
                           comp.certificate_policy === 'all_participants' ? "Sertifikat: Barchaga" :
                           "Sertifikat: Yo'q"}
                        </span>
                      </span>

                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{comp.duration || 60} soniya</span>
                      </span>

                      <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-full">{comp.reward_points} Ball</span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-white font-display">{comp.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{comp.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono">
                    <span>📚 Biriktirilgan matnlar:</span>
                    <strong className="text-amber-400">
                      {comp.texts_pool?.length || comp.selected_text_ids?.length || 1} ta matn
                    </strong>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">{comp.participants.length} ta qatnashchi</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditComp(comp)}
                      className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800 hover:bg-indigo-900"
                      title="Tahrirlash"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {comp.status === 'active' && (
                      <button
                        onClick={() => handleFinishCompetition(comp.id)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800 hover:bg-amber-900"
                      >
                        Yakunlash
                      </button>
                    )}

                    <button
                      onClick={() => setDeletingComp(comp)}
                      className="p-2 rounded-xl bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEXTS MANAGEMENT TAB */}
      {activeTab === 'texts' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Control Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-bold mb-1">
                <span>Veb-sayt Tizim Matnlari Boshqaruvi</span>
              </div>
              <h3 className="text-xl font-bold text-white font-display">Barcha Matnlar Boshqaruvi</h3>
              <p className="text-xs text-slate-400">Plaformadagi barcha bo'limlar, mashqlar va xabarlar matnlarini tahrirlash</p>
            </div>

            <button
              onClick={handleOpenCreateText}
              className="px-5 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi matn qo'shish</span>
            </button>
          </div>

          {/* Search and Language/Status Filter Bar */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={textSearchQuery}
                  onChange={e => setTextSearchQuery(e.target.value)}
                  placeholder="Sarlavha, ID yoki mazmun bo'yicha qidirish..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                />
                {textSearchQuery && (
                  <button onClick={() => setTextSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Language Filter */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">Til:</span>
                <select
                  value={textLanguageFilter}
                  onChange={e => setTextLanguageFilter(e.target.value)}
                  className="bg-transparent text-white font-bold w-full focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">Hamma tillar</option>
                  <option value="uz" className="bg-slate-900 text-white">O'zbekcha (UZ)</option>
                  <option value="en" className="bg-slate-900 text-white">English (EN)</option>
                  <option value="ru" className="bg-slate-900 text-white">Русский (RU)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <Filter className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">Holat:</span>
                <select
                  value={textStatusFilter}
                  onChange={e => setTextStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="bg-transparent text-white font-bold w-full focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">Barchasi</option>
                  <option value="active" className="bg-slate-900 text-white">Yoqilgan (Faol)</option>
                  <option value="inactive" className="bg-slate-900 text-white">O'chirilgan (Nofaol)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Selection and Action Control Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={textsList.length > 0 && textsList.every(t => selectedTextIds.includes(t.id))}
                  onChange={handleSelectAllTexts}
                  className="w-4 h-4 accent-amber-500 rounded border-slate-700 bg-slate-950 cursor-pointer"
                />
                <span>Barchasini Tanlash ({textsList.length} ta)</span>
              </label>

              {selectedTextIds.length > 0 && (
                <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-full">
                  Tanlandi: {selectedTextIds.length} ta
                </span>
              )}
            </div>

            {selectedTextIds.length > 0 && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-all cursor-pointer"
                >
                  Tanlovni bekor qilish
                </button>

                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Tanlanganlarni O'chirish ({selectedTextIds.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Unified Text Database Table */}
          {isTextsLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-3xl">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs font-semibold">Matnlar ma'lumotlar bazasi yuklanmoqda...</span>
            </div>
          ) : textsList.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-400">Hech qanday matn topilmadi</p>
              <p className="text-xs text-slate-500">Bazada matnlar mavjud emas yoki qidiruv mezoniga mos matn topilmadi.</p>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={textsList.length > 0 && textsList.every(t => selectedTextIds.includes(t.id))}
                          onChange={handleSelectAllTexts}
                          className="w-4 h-4 accent-amber-500 rounded border-slate-700 bg-slate-950 cursor-pointer"
                          title="Barchasini tanlash"
                        />
                      </th>
                      <th className="p-4 min-w-[100px]">Text ID</th>
                      <th className="p-4 min-w-[180px]">Sarlavha</th>
                      <th className="p-4 min-w-[280px]">Matn mazmuni (Preview)</th>
                      <th className="p-4 min-w-[80px] text-center">Til</th>
                      <th className="p-4 min-w-[90px] text-center">Belgilar</th>
                      <th className="p-4 min-w-[90px] text-center">So'zlar</th>
                      <th className="p-4 min-w-[130px]">Yaratilgan sana</th>
                      <th className="p-4 min-w-[120px] text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {textsList.map(item => {
                      const isSelected = selectedTextIds.includes(item.id);
                      const charCount = item.content ? item.content.length : 0;
                      const wordCount = item.content ? item.content.trim().split(/\s+/).filter(Boolean).length : 0;
                      const formattedDate = item.created_at ? new Date(item.created_at).toLocaleDateString('uz-UZ') : '—';

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors hover:bg-slate-800/40 ${
                            isSelected ? 'bg-amber-950/20' : !item.is_active ? 'opacity-60 bg-slate-950/30' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectText(item.id)}
                              className="w-4 h-4 accent-amber-500 rounded border-slate-700 bg-slate-950 cursor-pointer"
                            />
                          </td>

                          {/* ID */}
                          <td className="p-4 font-mono font-bold text-amber-400/90 whitespace-nowrap">
                            #{item.id}
                          </td>

                          {/* Title */}
                          <td className="p-4 font-bold text-white font-display">
                            <div className="flex flex-col gap-1">
                              <span>{item.title}</span>
                              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                                {CATEGORY_NAMES[item.category] || item.category}
                              </span>
                            </div>
                          </td>

                          {/* Content Preview */}
                          <td className="p-4 text-slate-300 font-mono text-[11px] leading-relaxed max-w-xs">
                            <p className="line-clamp-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                              {item.content}
                            </p>
                          </td>

                          {/* Language */}
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700 uppercase">
                              {item.language}
                            </span>
                          </td>

                          {/* Character Count */}
                          <td className="p-4 text-center font-mono font-semibold text-slate-300">
                            {charCount}
                          </td>

                          {/* Word Count */}
                          <td className="p-4 text-center font-mono font-semibold text-slate-300">
                            {wordCount}
                          </td>

                          {/* Date Created */}
                          <td className="p-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {formattedDate}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewingText(item)}
                                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-amber-400 border border-slate-800 transition-all cursor-pointer"
                                title="Ko'rish"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEditText(item)}
                                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-indigo-400 border border-slate-800 transition-all cursor-pointer"
                                title="Tahrirlash"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setDeletingText(item)}
                                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all cursor-pointer"
                                title="O'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATS TAB */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-1 shadow-xl">
            <span className="text-xs font-bold text-slate-400 block mb-1">Jami Foydalanuvchilar</span>
            <span className="text-4xl font-black text-indigo-400 font-mono">{stats.total_users} kishi</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-1 shadow-xl">
            <span className="text-xs font-bold text-slate-400 block mb-1">Tugallangan Testlar</span>
            <span className="text-4xl font-black text-cyan-400 font-mono">{stats.total_tests} ta</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-1 shadow-xl">
            <span className="text-xs font-bold text-slate-400 block mb-1">O'rtacha Platforma WPM</span>
            <span className="text-4xl font-black text-emerald-400 font-mono">{stats.avg_wpm} WPM</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-1 shadow-xl">
            <span className="text-xs font-bold text-slate-400 block mb-1">Eng Yuqori Natija</span>
            <span className="text-base font-bold text-amber-400 block truncate">{stats.top_typist.name}</span>
            <span className="text-2xl font-black text-white font-mono">{stats.top_typist.wpm} WPM</span>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE USER MODAL DIALOG --- */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Foydalanuvchini O'chirish</h3>
                <p className="text-xs text-slate-400">{deletingUser.ism} {deletingUser.familiya} (@{deletingUser.login})</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              Siz rostdan ham ushbu foydalanuvchini o'chirmoqchimisiz?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                disabled={isDeletingLoading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Yo'q
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingLoading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isDeletingLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Ha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-display">Foydalanuvchini Tahrirlash</h3>
              <button onClick={() => setEditingUser(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ism</label>
                <input
                  type="text"
                  value={editIsm}
                  onChange={e => setEditIsm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Familiya</label>
                <input
                  type="text"
                  value={editFamiliya}
                  onChange={e => setEditFamiliya(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Login</label>
                <input
                  type="text"
                  value={editLogin}
                  onChange={e => setEditLogin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max WPM</label>
                  <input
                    type="number"
                    value={editWpmMax}
                    onChange={e => setEditWpmMax(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Roli</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as 'user' | 'admin')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="user">Foydalanuvchi</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE COMPETITION MODAL --- */}
      {isCreateCompOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Yangi Musobaqa Yaratish</h3>
                <p className="text-xs text-slate-400">Musobaqa vaqti va matnlarini bazadan tanlang</p>
              </div>
              <button onClick={() => setIsCreateCompOpen(false)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompetition} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Musobaqa Nomi *</label>
                <input
                  type="text"
                  value={compTitle}
                  onChange={e => setCompTitle(e.target.value)}
                  placeholder="masalan: Respublika Tezkor Yozuv Chempionati"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tavsif</label>
                <textarea
                  value={compDesc}
                  onChange={e => setCompDesc(e.target.value)}
                  placeholder="Musobaqa qoidalari va mukofotlari haqida qisqacha..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white h-20 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Duration Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Vaqt (Soniya) *</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[15, 30, 60, 120, 300].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setCompDuration(sec)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          compDuration === sec
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {sec === 60 ? '60 soniya (1 daq)' : sec === 120 ? '120s (2 daq)' : sec === 300 ? '300s (5 daq)' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reward Points */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mukofot Ballari</label>
                  <input
                    type="number"
                    value={compReward}
                    onChange={e => setCompReward(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Certificate Policy (Sertifikat Siyosati) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Sertifikat Berish Siyosati (Certificate Policy)</span>
                </label>
                <select
                  value={compCertPolicy}
                  onChange={e => setCompCertPolicy(e.target.value as CertificatePolicy)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="none">Sertifikat berilmaydi (Faqat natija hisoboti PDF)</option>
                  <option value="winner_only">Faqat g'olibga (1-o'rin egalariga)</option>
                  <option value="top_3">Top 3 o'rin egalariga (1, 2, 3-o'rin)</option>
                  <option value="all_participants">Barcha ishtirokchilarga (Ishtirok sertifikati)</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {compCertPolicy === 'none' && "⚠️ Musobaqa tugagach sertifikat berilmaydi. Ishtirokchilar faqat Natija Hisoboti PDF yuklab oladilar."}
                  {compCertPolicy === 'winner_only' && "🥇 Faqat 1-o'rinni egallagan g'olibga profil sertifikati taqdim etiladi."}
                  {compCertPolicy === 'top_3' && "🏆 Top 3 talikka kirgan (1, 2, 3-o'rin) ishtirokchilarga profil sertifikati beriladi."}
                  {compCertPolicy === 'all_participants' && "📜 Musobaqani yakunlagan barcha foydalanuvchilarga sertifikat beriladi."}
                </p>
              </div>

              {/* Matnlar Bazasidan Tanlash */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Matnlar Bazasidan Tanlash *
                    </label>
                    <p className="text-[11px] text-slate-400">"Matnlar" bo'limidagi tayyor mashq va test matnlaridan tanlang</p>
                  </div>

                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                    Tanlandi: {selectedCompTexts.length} ta matn
                  </span>
                </div>

                {/* Search & Filters for Texts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Qidirish..."
                      value={modalTextSearch}
                      onChange={e => setModalTextSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <select
                    value={modalTextLang}
                    onChange={e => setModalTextLang(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="all">Barcha Tillar</option>
                    <option value="uz">O'zbekcha (UZ)</option>
                    <option value="en">English (EN)</option>
                    <option value="ru">Русский (RU)</option>
                  </select>

                  <select
                    value={modalTextCat}
                    onChange={e => setModalTextCat(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="barchasi">Barcha Kategoriyalar</option>
                    <option value="mashq">Mashq qilish</option>
                    <option value="test">Test</option>
                    <option value="jang">Jang</option>
                    <option value="kod">Kod yozish</option>
                    <option value="musobaqalar">Musobaqalar</option>
                  </select>
                </div>

                {/* Available Texts Selector List */}
                <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-2 space-y-1.5">
                  {isLoadingPracticeTexts ? (
                    <div className="py-6 text-center text-xs text-slate-400">Matnlar yuklanmoqda...</div>
                  ) : (() => {
                    const listToFilter = Array.isArray(allPracticeTexts) ? allPracticeTexts : [];
                    const filteredList = listToFilter.filter(t => {
                      if (modalTextLang !== 'all' && t.language !== modalTextLang) return false;
                      if (modalTextCat !== 'barchasi' && t.category !== modalTextCat) return false;
                      if (modalTextSearch.trim()) {
                        const q = modalTextSearch.toLowerCase();
                        return t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q);
                      }
                      return true;
                    });

                    if (filteredList.length === 0) {
                      return <div className="py-6 text-center text-xs text-slate-500">Mos matnlar topilmadi</div>;
                    }

                    return filteredList.map(t => {
                      const isSelected = selectedCompTexts.some(st => st.id === t.id);
                      return (
                        <div
                          key={t.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-800/80'
                              : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{t.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">{t.language}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 uppercase">{t.category}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{t.content}</p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setModalPreviewText(t)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Matnni ko'rish"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleSelectTextForComp(t)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-600 hover:bg-amber-500 text-white'
                              }`}
                            >
                              {isSelected ? '✓ Tanlandi' : '+ Tanlash'}
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Selected Texts Summary */}
                {selectedCompTexts.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-300">Tanlangan Matnlar Ro'yxati:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompTexts.map(st => (
                        <div
                          key={st.id}
                          className="flex items-center gap-2 bg-amber-950/80 border border-amber-800 text-amber-200 px-3 py-1.5 rounded-xl text-xs"
                        >
                          <span className="font-bold">{st.title}</span>
                          <span className="text-[10px] text-slate-400">({st.content.split(' ').length} so'z)</span>
                          <button
                            type="button"
                            onClick={() => setModalPreviewText(st)}
                            className="text-amber-400 hover:text-white"
                            title="Ko'rish"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCompTexts(prev => prev.filter(p => p.id !== st.id))}
                            className="text-rose-400 hover:text-rose-300"
                            title="O'chirish"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {selectedCompTexts.length > 1 && (
                      <p className="text-[11px] text-amber-400/90 italic">
                        💡 Multiple matnlar biriktirildi. Har bir ishtirokchi uchun ushbu matnlardan biri tasodifiy (random) tanlanadi.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-rose-950/40 border border-rose-900 rounded-2xl text-xs text-rose-300 font-medium text-center">
                    ⚠️ Musobaqa yaratish uchun yuqoridagi ro'yxatdan kamida 1 ta matn tanlashingiz shart!
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCompOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={selectedCompTexts.length === 0}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-600/20"
                >
                  Musobaqani Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT COMPETITION MODAL --- */}
      {editingComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Musobaqani Tahrirlash</h3>
                <p className="text-xs text-slate-400">Musobaqa matni va davomiyligini tahrirlang</p>
              </div>
              <button onClick={() => setEditingComp(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditComp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Musobaqa Nomi *</label>
                <input
                  type="text"
                  value={compTitle}
                  onChange={e => setCompTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tavsif</label>
                <textarea
                  value={compDesc}
                  onChange={e => setCompDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white h-20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Duration Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Vaqt (Soniya) *</span>
                  </label>
                  <select
                    value={compDuration}
                    onChange={e => setCompDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    <option value={15}>15 soniya</option>
                    <option value={30}>30 soniya</option>
                    <option value={60}>60 soniya (1 daqiqa)</option>
                    <option value={120}>120 soniya (2 daqiqa)</option>
                    <option value={300}>300 soniya (5 daqiqa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mukofot Ballari</label>
                  <input
                    type="number"
                    value={compReward}
                    onChange={e => setCompReward(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Holati</label>
                  <select
                    value={editCompStatus}
                    onChange={e => setEditCompStatus(e.target.value as 'active' | 'upcoming' | 'finished')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="active">Faol Musobaqa</option>
                    <option value="finished">Yakunlangan</option>
                  </select>
                </div>
              </div>

              {/* Certificate Policy (Sertifikat Siyosati) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>Sertifikat Berish Siyosati (Certificate Policy)</span>
                </label>
                <select
                  value={compCertPolicy}
                  onChange={e => setCompCertPolicy(e.target.value as CertificatePolicy)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="none">Sertifikat berilmaydi (Faqat natija hisoboti PDF)</option>
                  <option value="winner_only">Faqat g'olibga (1-o'rin egalariga)</option>
                  <option value="top_3">Top 3 o'rin egalariga (1, 2, 3-o'rin)</option>
                  <option value="all_participants">Barcha ishtirokchilarga (Ishtirok sertifikati)</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {compCertPolicy === 'none' && "⚠️ Musobaqa tugagach sertifikat berilmaydi. Ishtirokchilar faqat Natija Hisoboti PDF yuklab oladilar."}
                  {compCertPolicy === 'winner_only' && "🥇 Faqat 1-o'rinni egallagan g'olibga profil sertifikati taqdim etiladi."}
                  {compCertPolicy === 'top_3' && "🏆 Top 3 talikka kirgan (1, 2, 3-o'rin) ishtirokchilarga profil sertifikati beriladi."}
                  {compCertPolicy === 'all_participants' && "📜 Musobaqani yakunlagan barcha foydalanuvchilarga sertifikat beriladi."}
                </p>
              </div>

              {/* Matnlar Bazasidan Tanlash */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Matnlar Bazasidan Tanlash *
                    </label>
                    <p className="text-[11px] text-slate-400">Musobaqaga biriktirilgan matnlarni yangilang yoki qo'shing</p>
                  </div>

                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
                    Tanlandi: {selectedCompTexts.length} ta matn
                  </span>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Qidirish..."
                      value={modalTextSearch}
                      onChange={e => setModalTextSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <select
                    value={modalTextLang}
                    onChange={e => setModalTextLang(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="all">Barcha Tillar</option>
                    <option value="uz">O'zbekcha (UZ)</option>
                    <option value="en">English (EN)</option>
                    <option value="ru">Русский (RU)</option>
                  </select>

                  <select
                    value={modalTextCat}
                    onChange={e => setModalTextCat(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="barchasi">Barcha Kategoriyalar</option>
                    <option value="mashq">Mashq qilish</option>
                    <option value="test">Test</option>
                    <option value="jang">Jang</option>
                    <option value="kod">Kod yozish</option>
                    <option value="musobaqalar">Musobaqalar</option>
                  </select>
                </div>

                {/* Available Texts Selector List */}
                <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-2 space-y-1.5">
                  {isLoadingPracticeTexts ? (
                    <div className="py-6 text-center text-xs text-slate-400">Matnlar yuklanmoqda...</div>
                  ) : (() => {
                    const listToFilter = Array.isArray(allPracticeTexts) ? allPracticeTexts : [];
                    const filteredList = listToFilter.filter(t => {
                      if (modalTextLang !== 'all' && t.language !== modalTextLang) return false;
                      if (modalTextCat !== 'barchasi' && t.category !== modalTextCat) return false;
                      if (modalTextSearch.trim()) {
                        const q = modalTextSearch.toLowerCase();
                        return t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q);
                      }
                      return true;
                    });

                    if (filteredList.length === 0) {
                      return <div className="py-6 text-center text-xs text-slate-500">Mos matnlar topilmadi</div>;
                    }

                    return filteredList.map(t => {
                      const isSelected = selectedCompTexts.some(st => st.id === t.id);
                      return (
                        <div
                          key={t.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-800/80'
                              : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{t.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">{t.language}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 uppercase">{t.category}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{t.content}</p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setModalPreviewText(t)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Matnni ko'rish"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleSelectTextForComp(t)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                            >
                              {isSelected ? '✓ Tanlandi' : '+ Tanlash'}
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Selected Texts List */}
                {selectedCompTexts.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-300">Biriktirilgan Matnlar Ro'yxati:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompTexts.map(st => (
                        <div
                          key={st.id}
                          className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-800 text-indigo-200 px-3 py-1.5 rounded-xl text-xs"
                        >
                          <span className="font-bold">{st.title}</span>
                          <span className="text-[10px] text-slate-400">({st.content.split(' ').length} so'z)</span>
                          <button
                            type="button"
                            onClick={() => setModalPreviewText(st)}
                            className="text-indigo-400 hover:text-white"
                            title="Ko'rish"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCompTexts(prev => prev.filter(p => p.id !== st.id))}
                            className="text-rose-400 hover:text-rose-300"
                            title="O'chirish"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingComp(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={selectedCompTexts.length === 0}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PREVIEW TEXT MODAL (FOR COMPETITION MODAL) --- */}
      {modalPreviewText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-display">{modalPreviewText.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-mono">{modalPreviewText.language}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 uppercase font-mono">{modalPreviewText.category}</span>
                </div>
              </div>

              <button onClick={() => setModalPreviewText(null)} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-sm text-slate-200 font-mono leading-relaxed max-h-60 overflow-y-auto select-none">
              {modalPreviewText.content}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setModalPreviewText(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE COMPETITION MODAL --- */}
      {deletingComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Musobaqani O'chirish</h3>
                <p className="text-xs text-slate-400">{deletingComp.title}</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              Siz rostdan ham ushbu musobaqani va uning barcha natijalarini o'chirmoqchimisiz?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingComp(null)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Yo'q
              </button>
              <button
                onClick={handleConfirmDeleteComp}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
              >
                Ha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE NEW ADMIN MODAL --- */}
      {isCreateAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-amber-800/80 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Yangi Admin Qo'shish</h3>
                  <p className="text-[11px] text-slate-400">Tizimga yangi administrator biriktirish</p>
                </div>
              </div>
              <button onClick={() => setIsCreateAdminOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Login <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newAdminLogin}
                  onChange={e => setNewAdminLogin(e.target.value)}
                  placeholder="masalan: admin_sherzod"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ism (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={newAdminIsm}
                    onChange={e => setNewAdminIsm(e.target.value)}
                    placeholder="Sherzod"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Familiya (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={newAdminFamiliya}
                    onChange={e => setNewAdminFamiliya(e.target.value)}
                    placeholder="Karimov"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Parol <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  value={newAdminPass}
                  onChange={e => setNewAdminPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Parolni tasdiqlash <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  value={newAdminPassConfirm}
                  onChange={e => setNewAdminPassConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingAdmin && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Admin qo'shish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT TEXT MODAL --- */}
      {isCreateTextOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-display">
                {editingText ? "Matnni Tahrirlash" : "Yangi Tizim Matni Qo'shish"}
              </h3>
              <button onClick={() => setIsCreateTextOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveText} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Matn Sarlavhasi</label>
                <input
                  type="text"
                  value={textFormTitle}
                  onChange={e => setTextFormTitle(e.target.value)}
                  placeholder="masalan: Alisher Navoiy g'azallari haqida"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategoriya</label>
                  <select
                    value={textFormCategory}
                    onChange={e => setTextFormCategory(e.target.value as TextCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none cursor-pointer"
                  >
                    <option value="mashq">Mashq qilish</option>
                    <option value="test">Test</option>
                    <option value="jang">Jang</option>
                    <option value="kod">Kod yozish</option>
                    <option value="musobaqalar">Musobaqalar</option>
                    <option value="bosh_sahifa">Bosh sahifa</option>
                    <option value="profil">Profil</option>
                    <option value="sertifikat">Sertifikat</option>
                    <option value="sozlamalar">Sozlamalar</option>
                    <option value="tugmalar">Tugmalar</option>
                    <option value="xabarlar">Xabarlar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Til</label>
                  <select
                    value={textFormLanguage}
                    onChange={e => setTextFormLanguage(e.target.value as TextLanguage)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none cursor-pointer"
                  >
                    <option value="uz">O'zbekcha (uz)</option>
                    <option value="en">English (en)</option>
                    <option value="ru">Русский (ru)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Holati</label>
                  <select
                    value={textFormIsActive ? 'true' : 'false'}
                    onChange={e => setTextFormIsActive(e.target.value === 'true')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none cursor-pointer"
                  >
                    <option value="true">Faol (Yoqilgan)</option>
                    <option value="false">Nofaol (O'chirilgan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Matn Mazmuni</label>
                <textarea
                  value={textFormContent}
                  onChange={e => setTextFormContent(e.target.value)}
                  placeholder="Ushbu yerga mashq yoki test uchun to'liq matnni kiriting..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white h-36 focus:border-amber-500 outline-none font-mono leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTextOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSavingText}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingText && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PREVIEW TEXT MODAL --- */}
      {previewingText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    {CATEGORY_NAMES[previewingText.category] || previewingText.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                    {previewingText.language}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-display">{previewingText.title}</h3>
              </div>
              <button onClick={() => setPreviewingText(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-sm text-slate-200 leading-relaxed max-h-60 overflow-y-auto">
              {previewingText.content}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span>Jami belgilar: <strong className="text-white">{previewingText.content.length}</strong></span>
              <span>Jami so'zlar: <strong className="text-amber-400">{previewingText.content.split(/\s+/).filter(Boolean).length}</strong></span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewingText(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE TEXT MODAL --- */}
      {deletingText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Matnni O'chirish</h3>
                <p className="text-xs text-slate-400">{deletingText.title}</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              Siz rostdan ham ushbu matnni bazadan buttunlay o'chirmoqchimisiz?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingText(null)}
                disabled={isDeletingTextLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 cursor-pointer disabled:opacity-50"
              >
                Yo'q
              </button>
              <button
                onClick={handleConfirmDeleteText}
                disabled={isDeletingTextLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingTextLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Ha, O'chirish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM BULK DELETE TEXTS MODAL --- */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Ko'plab Matnlarni O'chirish</h3>
                <p className="text-xs text-rose-400 font-semibold">{selectedTextIds.length} ta matn tanlangan</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                Siz rostdan ham tanlangan <strong className="text-amber-400">{selectedTextIds.length} ta matnni</strong> bazadan buttunlay o'chirmoqchimisiz?
              </p>

              <div className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-3 text-xs text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Diqqat!</span>
                </div>
                <p className="text-[11px] text-rose-300/90 leading-relaxed">
                  Ushbu amal qaytarilmaydi! Agar tanlangan matnlar musobaqalar yoki testlarda ishlatilayotgan bo'lsa, ular mos bo'limlardan ham avtomatik ravishda olib tashlanadi.
                </p>
              </div>

              {/* List preview of selected titles */}
              <div className="max-h-28 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                {textsList.filter(t => selectedTextIds.includes(t.id)).map(t => (
                  <div key={t.id} className="text-slate-300 truncate font-mono">
                    • {t.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isBulkDeletingLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 cursor-pointer disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleConfirmBulkDeleteTexts}
                disabled={isBulkDeletingLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBulkDeletingLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Ha, {selectedTextIds.length} ta Matnni O'chirish</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
