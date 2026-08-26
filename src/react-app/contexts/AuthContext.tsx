import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { reconnectSupabaseAuth, supabase } from '@/react-app/supabase';
import type { Perfil, UserRole } from '@/shared/types';

interface AuthContextType {
  user: any | null;
  perfil: Perfil | null;
  role: UserRole | 'visitante';
  loading: boolean;
  isAdmin: boolean;
  isFuncionario: boolean;
  isCliente: boolean;
  login: (email: string, pass?: string) => Promise<{ success: boolean; error?: string }>;
  registerClient: (data: {
    nome: string;
    email: string;
    telefone: string;
    cpf_cnpj: string;
    senha: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const LOCAL_SESSION_KEY = 'oliveira_auth_session';

const removeLegacyPasswordVault = () => {
  try {
    localStorage.removeItem('oliveira_auth_vault');
  } catch { /* armazenamento indisponível */ }
};
const getStoredSession = () => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_SESSION_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      // Se for sessÃ£o falsa antiga (corp-), descarta e limpa
      if (parsed?.user?.id && String(parsed.user.id).startsWith('corp-')) {
        localStorage.removeItem(LOCAL_SESSION_KEY);
        return null;
      }
      return parsed;
    }
  } catch { /* no-op: operacao local, ignorar erro */ }
  return null;
};

const saveSessionToStorage = (u: any, p: Perfil | null, r: UserRole | 'visitante') => {
  try {
    if (typeof window !== 'undefined') {
      if (u && r !== 'visitante' && !String(u.id || '').startsWith('corp-')) {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user: u, perfil: p, role: r }));
      } else {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
    }
  } catch { /* no-op: operacao local, ignorar erro */ }
};

const MASTER_ADMIN_EMAILS = [
  'odair.orso78@gmail.com',
  'veiculos.oliveira@gmail.com',
  'odair_orso@hotmail.com'
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialSession = getStoredSession();
  const [user, setUser] = useState<any | null>(() => initialSession?.user || null);
  const [perfil, setPerfil] = useState<Perfil | null>(() => initialSession?.perfil || null);
  const [currentRole, setCurrentRole] = useState<UserRole | 'visitante'>(() => initialSession?.role || 'visitante');
  const [loading, setLoading] = useState(!initialSession?.user);

  const fetchProfileForUser = async (authUser: any) => {
    if (!authUser || !authUser.email) return;

    const email = authUser.email.toLowerCase().trim();

    try {
      // 1. Buscar perfil oficial na tabela perfis
      const { data: dbPerfil, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (dbPerfil && !error) {
        setPerfil(dbPerfil);
        const r = dbPerfil.role || 'funcionario';
        setCurrentRole(r);
        saveSessionToStorage(authUser, dbPerfil, r);
        return;
      }

      // 2. Se não existir perfil na tabela perfis, determinar role com base no email
      const isAdminEmail = MASTER_ADMIN_EMAILS.includes(email);
      const isStaff = isAdminEmail || email.includes('ricardo.oliveiraveiculos@gmail.com');
      const computedRole: UserRole = isAdminEmail ? 'admin' : (isStaff ? 'funcionario' : 'cliente');

      const novoPerfil: Perfil = {
        email,
        nome: authUser.user_metadata?.name || (isAdminEmail ? 'Odair Roberto de Oliveira' : (isStaff ? 'Ricardo (Equipe)' : email.split('@')[0])),
        telefone: authUser.user_metadata?.phone || '(67) 99622-9840',
        role: computedRole,
        ativo: true
      };

      setPerfil(novoPerfil);
      setCurrentRole(computedRole);
      saveSessionToStorage(authUser, novoPerfil, computedRole);
    } catch (e) {
      console.warn('Aviso ao carregar perfil do usuário:', e);
      const isMaster = MASTER_ADMIN_EMAILS.includes(email);
      const fallbackRole: UserRole = isMaster ? 'admin' : 'cliente';
      setCurrentRole(fallbackRole);
      saveSessionToStorage(authUser, perfil, fallbackRole);
    }
  };

  useEffect(() => {
    // A versão anterior gravava senha em texto puro. A sessão persistida pelo
    // Supabase é suficiente e este resíduo não deve permanecer no aparelho.
    removeLegacyPasswordVault();

    // 1. Carregar a sessão persistida pelo próprio Supabase.
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchProfileForUser(session.user);
        } else {
          const stored = getStoredSession();
          if (!stored?.user) {
            setUser(null);
            setPerfil(null);
            setCurrentRole('visitante');
            saveSessionToStorage(null, null, 'visitante');
          }
        }
      } catch (err) {
        console.warn('Erro ao inicializar sessão:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 2. Escutar mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        void fetchProfileForUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPerfil(null);
        setCurrentRole('visitante');
        saveSessionToStorage(null, null, 'visitante');
      }
    });

    // 3. Listener para quando a internet voltar ou o app for reaberto
    const handleReconectar = () => {
      void reconnectSupabaseAuth().then(() => initSession());
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleReconectar();
    };

    window.addEventListener('online', handleReconectar);
    window.addEventListener('focus', handleReconectar);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('online', handleReconectar);
      window.removeEventListener('focus', handleReconectar);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const login = async (email: string, pass?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();

    if (!pass || pass.trim() === '') {
      return { success: false, error: 'Por favor, digite a sua senha de acesso.' };
    }

    try {
      const isMaster = MASTER_ADMIN_EMAILS.includes(cleanEmail);
      const isStaff = isMaster || cleanEmail === 'ricardo.oliveiraveiculos@gmail.com';

      // Realizar Login autêntico com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass
      });

      if (authError || !authData?.user) {
        let msg = 'Erro ao realizar login.';
        if (authError?.message === 'Invalid login credentials' || authError?.message?.includes('Invalid login')) {
          msg = 'E-mail ou senha incorretos.';
        } else if (authError?.message?.includes('network') || authError?.message?.includes('fetch') || authError?.message?.includes('timeout')) {
          msg = 'Falha na conexão com a internet. Verifique sua rede e tente novamente.';
        } else if (authError?.message) {
          msg = authError.message;
        }
        return { success: false, error: msg };
      }

      const authUser = authData.user;
      setUser(authUser);

      const initialRole: UserRole = isMaster ? 'admin' : (isStaff ? 'funcionario' : 'cliente');
      const initialPerfil: Perfil = {
        email: cleanEmail,
        nome: authUser.user_metadata?.name || (isMaster ? 'Odair Roberto de Oliveira' : (isStaff ? 'Ricardo (Equipe)' : cleanEmail.split('@')[0])),
        telefone: authUser.user_metadata?.phone || '(67) 99622-9840',
        role: initialRole,
        ativo: true
      };

      setCurrentRole(initialRole);
      setPerfil(initialPerfil);
      
      // A sessão e o refresh token já são persistidos pelo Supabase.
      saveSessionToStorage(authUser, initialPerfil, initialRole);

      // Busca perfil no banco em background
      fetchProfileForUser(authUser).catch(() => {});

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha de comunicaÃ§Ã£o com o servidor.' };
    }
  };

  const registerClient = async (data: {
    nome: string;
    email: string;
    telefone: string;
    cpf_cnpj: string;
    senha: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = data.email.toLowerCase().trim();

    try {
      // 1. Criar usuÃ¡rio no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.senha,
        options: {
          data: {
            name: data.nome,
            phone: data.telefone,
            document: data.cpf_cnpj
          }
        }
      });

      if (authError || !authData?.user) {
        setLoading(false);
        return { success: false, error: authError?.message || 'Erro ao criar conta.' };
      }

      // 2. Salvar na tabela clientes
      try {
        await supabase.from('clientes').insert([{
          nome: data.nome,
          documento: data.cpf_cnpj,
          tipo_documento: data.cpf_cnpj.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF',
          celular: data.telefone,
          email: cleanEmail,
          endereco: 'Cadastrado via App'
        }]);
      } catch (errCli) {
        console.warn('Aviso ao inserir cliente:', errCli);
      }

      // 3. Salvar perfil como cliente
      const clientPerfil: Perfil = {
        email: cleanEmail,
        nome: data.nome,
        telefone: data.telefone,
        role: 'cliente',
        ativo: true
      };

      try {
        await supabase.from('perfis').upsert([clientPerfil], { onConflict: 'email' });
      } catch (errPerf) {
        console.warn('Aviso ao inserir perfil:', errPerf);
      }

      setUser(authData.user);
      setPerfil(clientPerfil);
      setCurrentRole('cliente');
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err?.message || 'Falha ao realizar cadastro.' };
    }
  };

  const logout = async () => {
    // 1. Imediatamente reseta o estado da aplicaÃ§Ã£o
    setUser(null);
    setPerfil(null);
    setCurrentRole('visitante');

    // 2. Remover APENAS as chaves do app â€” NÃƒO limpar tudo
    // (localStorage.clear() apaga os tokens internos do Supabase e quebra o login!)
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (key.startsWith('oliveira_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch { /* no-op: operacao local, ignorar erro */ }

    // 3. Executar signOut no Supabase
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]);
    } catch (e) {
      console.warn('Aviso no signOut:', e);
    }
  };

  const isAdmin = currentRole === 'admin';
  const isFuncionario = currentRole === 'funcionario' || currentRole === 'admin';
  const isCliente = currentRole === 'cliente';

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        role: currentRole,
        loading,
        isAdmin,
        isFuncionario,
        isCliente,
        login,
        registerClient,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
