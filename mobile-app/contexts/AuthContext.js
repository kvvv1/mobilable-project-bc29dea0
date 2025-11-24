import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService } from '../services/authService';
import { supabase } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const AuthContext = createContext({});

const ONBOARDING_KEY = '@driverflow:onboarding_completed';
const TUTORIAL_KEY = '@driverflow:tutorial_completed';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  useEffect(() => {
    // Verificar se há sessão salva
    checkSession();

    // Listener de mudanças de autenticação
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        logger.log('Auth state changed:', event, 'Has session:', !!session);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            logger.debug('Sessão detectada, atualizando estados...', event);
            setSession(session);
            // Carregar usuário e verificar onboarding/tutorial
            await loadUser();
            // Aguardar um pouco para garantir que os estados foram atualizados
            await new Promise(resolve => setTimeout(resolve, 200));
            // Verificar onboarding e tutorial novamente
            await Promise.all([checkOnboarding(), checkTutorial()]);
            logger.debug('Estados atualizados após SIGNED_IN');
          } else {
            logger.warn('Evento SIGNED_IN sem sessão');
          }
        } else if (event === 'SIGNED_OUT') {
          logger.debug('Usuário deslogado');
          setUser(null);
          setSession(null);
          setOnboardingCompleted(false);
          setTutorialCompleted(false);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          if (!session) {
            // Não há sessão inicial, apenas finalizar loading
            logger.debug('Nenhuma sessão inicial encontrada');
            setUser(null);
            setSession(null);
            setLoading(false);
          } else {
            // Há sessão inicial, carregar usuário
            logger.debug('Sessão inicial encontrada, carregando usuário...');
            setSession(session);
            await loadUser();
            const [onboardingOk, tutorialOk] = await Promise.all([checkOnboarding(), checkTutorial()]);
            
            // Se onboarding não está completo, fazer logout para que o usuário veja o Login primeiro
            // Isso garante o fluxo: LOGIN → ONBOARDING → TUTORIAL → APP
            if (!onboardingOk) {
              logger.debug('Onboarding não completo - fazendo logout para mostrar Login primeiro');
              await AuthService.signOut();
              setUser(null);
              setSession(null);
              setOnboardingCompleted(false);
              setTutorialCompleted(false);
            }
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Verificar onboarding e tutorial
    checkOnboarding();
    checkTutorial();
  }, [user]);

  const checkSession = async () => {
    try {
      const { success, session: currentSession } = await AuthService.getSession();
      
      if (success && currentSession) {
        setSession(currentSession);
        await loadUser();
      } else {
        setLoading(false);
      }
    } catch (error) {
      logger.error('Erro ao verificar sessão:', error);
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      // Verificar se há sessão antes de buscar o usuário
      const { success: hasSession, session: currentSession } = await AuthService.getSession();
      
      if (!hasSession || !currentSession) {
        logger.debug('Nenhuma sessão encontrada');
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }
      
      setSession(currentSession);
      logger.debug('Sessão definida, buscando usuário...');
      
      const { success, user: currentUser } = await AuthService.getCurrentUser();
      
      if (success && currentUser) {
        setUser(currentUser);
        logger.debug('Usuário carregado:', currentUser.id);
        
        // Verificar onboarding e tutorial após carregar o usuário
        // IMPORTANTE: Apenas verificar, não criar perfil aqui
        // A criação do perfil será feita no OnboardingScreen quando necessário
        const [onboardingOk, tutorialOk] = await Promise.all([
          checkOnboarding(),
          checkTutorial(),
        ]);
        
        logger.debug('Estados atualizados após loadUser - Onboarding:', onboardingOk, 'Tutorial:', tutorialOk);
        logger.debug('isAuthenticated será:', !!currentUser && !!currentSession);
      } else {
        setUser(null);
        logger.warn('Usuário não encontrado');
      }
    } catch (error) {
      // Não logar erro se for apenas falta de sessão
      if (error.message && !error.message.includes('session')) {
        logger.error('Erro ao carregar usuário:', error);
      }
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const checkOnboarding = async () => {
    try {
      // Só verificar se há usuário autenticado
      if (!user) {
        setOnboardingCompleted(false);
        return false;
      }

      // Primeiro verificar AsyncStorage
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      let isCompleted = completed === 'true';
      
      logger.debug('Onboarding no AsyncStorage:', isCompleted, 'User ID:', user.id);
      
      // Se não está marcado como completo no AsyncStorage, verificar se já tem dados no banco
      // IMPORTANTE: Não criar perfil aqui - isso será feito no OnboardingScreen
      if (!isCompleted) {
        try {
          logger.debug('Verificando organização do usuário no banco...');
          
          // Verificar perfil uma única vez (sem retry, sem criar)
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('current_organization_id')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            if (profileError.code === 'PGRST116') {
              // Perfil não existe - isso é normal, será criado no OnboardingScreen
              logger.debug('Perfil não encontrado - será criado no OnboardingScreen');
              isCompleted = false;
            } else {
              logger.warn('Erro ao buscar perfil:', profileError);
              isCompleted = false;
            }
          } else if (profile?.current_organization_id) {
            // Usuário já tem organização, considerar onboarding completo
            // (veículos podem ser adicionados depois)
            isCompleted = true;
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
            logger.debug('Onboarding detectado como completo (usuário tem organização):', profile.current_organization_id);
          } else {
            logger.debug('Usuário não tem organização ainda - onboarding não completo');
            isCompleted = false;
          }
        } catch (error) {
          logger.warn('Erro ao verificar organização do usuário:', error);
          isCompleted = false;
        }
      }
      
      setOnboardingCompleted(isCompleted);
      logger.debug('Onboarding final verificado:', isCompleted, 'User ID:', user.id);
      return isCompleted;
    } catch (error) {
      logger.error('Erro ao verificar onboarding:', error);
      setOnboardingCompleted(false);
      return false;
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      logger.debug('Iniciando login...');
      const result = await AuthService.signIn(email, password);
      
      if (result.success) {
        logger.debug('Login bem-sucedido, carregando usuário...');
        // Carregar usuário primeiro (já verifica onboarding automaticamente)
        await loadUser();
        
        logger.debug('Login concluído');
        return { success: true, error: null };
      }
      
      logger.warn('Login falhou:', result.error);
      return result;
    } catch (error) {
      logger.error('Erro no login:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      logger.debug('Iniciando login com Google...');
      const result = await AuthService.signInWithGoogle();
      
      if (result.success) {
        // O listener de autenticação irá atualizar os estados automaticamente
        logger.debug('Login com Google iniciado, aguardando callback...');
        return { success: true, error: null };
      }
      
      logger.warn('Login com Google falhou:', result.error);
      return result;
    } catch (error) {
      logger.error('Erro no login com Google:', error);
      return { success: false, error: error.message };
    } finally {
      // Não finalizar loading aqui, pois o fluxo OAuth é assíncrono
      // O loading será finalizado quando o callback for processado
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      logger.debug('Iniciando cadastro...');
      const result = await AuthService.signUp(email, password, userData);
      
      if (result.success) {
        logger.debug('Cadastro bem-sucedido, carregando usuário...');
        // Carregar usuário após cadastro
        await loadUser();
        
        // Apenas verificar onboarding (não criar perfil aqui)
        // O perfil será criado no OnboardingScreen quando necessário
        await checkOnboarding();
        
        logger.debug('Cadastro concluído');
        return { success: true, error: null };
      }
      
      return result;
    } catch (error) {
      logger.error('Erro no cadastro:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const result = await AuthService.signOut();
      
      if (result.success) {
        setUser(null);
        setSession(null);
        setOnboardingCompleted(false);
        setTutorialCompleted(false);
        await AsyncStorage.removeItem(ONBOARDING_KEY);
        await AsyncStorage.removeItem(TUTORIAL_KEY);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      return await AuthService.resetPassword(email);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const result = await AuthService.updateProfile(updates);
      
      if (result.success) {
        await loadUser();
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const checkTutorial = async () => {
    try {
      const completed = await AsyncStorage.getItem(TUTORIAL_KEY);
      const isCompleted = completed === 'true';
      setTutorialCompleted(isCompleted);
      logger.debug('Tutorial verificado:', isCompleted);
      return isCompleted;
    } catch (error) {
      logger.error('Erro ao verificar tutorial:', error);
      setTutorialCompleted(false);
      return false;
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setOnboardingCompleted(true);
      logger.debug('Onboarding marcado como completo');
      return { success: true };
    } catch (error) {
      logger.error('Erro ao completar onboarding:', error);
      return { success: false, error: error.message };
    }
  };

  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
      setTutorialCompleted(true);
      logger.debug('Tutorial marcado como completo');
      return { success: true };
    } catch (error) {
      logger.error('Erro ao completar tutorial:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    session,
    loading,
    onboardingCompleted,
    tutorialCompleted,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    completeOnboarding,
    completeTutorial,
    isAuthenticated: !!user && !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

export default AuthContext;

