import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { logger } from '../utils/logger';

// Configurar WebBrowser para completar o fluxo OAuth
WebBrowser.maybeCompleteAuthSession();

// Configuração do Supabase
// Tentar obter das variáveis de ambiente ou do app.config.js
let supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                  process.env.EXPO_PUBLIC_SUPABASE_URL;

let supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Valores padrão (substitua pela sua chave anon real)
if (!supabaseUrl) {
  supabaseUrl = 'https://wlfmhygheizuuyohcbyj.supabase.co';
  console.warn('⚠️ Usando URL padrão do Supabase. Configure EXPO_PUBLIC_SUPABASE_URL para produção.');
}

if (!supabaseAnonKey) {
  console.error('❌ ERRO: Supabase Anon Key não encontrada!');
  console.error('📝 Para corrigir:');
  console.error('   1. Acesse: https://supabase.com/dashboard/project/wlfmhygheizuuyohcbyj/settings/api');
  console.error('   2. Copie a "anon public" key');
  console.error('   3. Crie um arquivo .env na pasta mobile-app com:');
  console.error('      EXPO_PUBLIC_SUPABASE_URL=https://wlfmhygheizuuyohcbyj.supabase.co');
  console.error('      EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui');
  console.error('   4. Reinicie o servidor: npm start --clear');
  throw new Error('Supabase Anon Key é obrigatória. Configure EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env');
}

if (!supabaseUrl) {
  throw new Error('Supabase URL é obrigatória');
}

logger.debug('Supabase configurado:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const STORAGE_KEY = '@driverflow:auth_token';

export const AuthService = {
  /**
   * Registra um novo usuário
   */
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Tenta desabilitar confirmação
          data: {
            full_name: userData.fullName || '',
            phone: userData.phone || '',
          },
        },
      });

      if (error) throw error;

      // Se o usuário foi criado e tem sessão, já está logado
      if (data.session) {
        logger.debug('Usuário criado com sessão - aguardando trigger criar perfil...');
        // Aguardar um pouco para o trigger do Supabase criar o perfil
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, data, error: null };
      }

      // Se não tem sessão, pode ser que precise confirmar email
      // Tentar fazer login automaticamente
      if (data.user) {
        logger.debug('Usuário criado sem sessão - tentando fazer login...');
        const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (sessionError) {
          // Se falhar, pode ser email não confirmado
          if (sessionError.message.includes('email') && sessionError.message.includes('confirm')) {
            return {
              success: false,
              data: null,
              error: 'Por favor, desabilite a confirmação de email nas configurações do Supabase (Authentication > Providers > Email > Enable email confirmations: OFF)',
            };
          }
          throw sessionError;
        }

        // Aguardar um pouco para o trigger do Supabase criar o perfil
        if (sessionData?.session) {
          logger.debug('Login bem-sucedido - aguardando trigger criar perfil...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return { success: true, data: sessionData, error: null };
      }

      return { success: true, data, error: null };
    } catch (error) {
      logger.error('Erro ao registrar:', error);
      
      // Mensagem mais clara para email não confirmado
      if (error.message && error.message.includes('email') && error.message.includes('confirm')) {
        return {
          success: false,
          data: null,
          error: 'Confirmação de email está habilitada. Desabilite em: Supabase Dashboard > Authentication > Providers > Email > Enable email confirmations: OFF',
        };
      }

      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Faz login do usuário
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Tratar erro de email não confirmado
        if (error.message && error.message.includes('email') && error.message.includes('confirm')) {
          return {
            success: false,
            data: null,
            error: 'Email não confirmado. Por favor, desabilite a confirmação de email nas configurações do Supabase (Authentication > Providers > Email > Enable email confirmations: OFF)',
          };
        }
        throw error;
      }

      // Salvar token
      if (data.session?.access_token) {
        await AsyncStorage.setItem(STORAGE_KEY, data.session.access_token);
      }

      return { success: true, data, error: null };
    } catch (error) {
      logger.error('Erro ao fazer login:', error);
      
      // Mensagem mais clara para email não confirmado
      if (error.message && error.message.includes('email') && error.message.includes('confirm')) {
        return {
          success: false,
          data: null,
          error: 'Email não confirmado. Desabilite a confirmação em: Supabase Dashboard > Authentication > Providers > Email',
        };
      }

      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Faz logout
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      await AsyncStorage.removeItem(STORAGE_KEY);
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      logger.error('Erro ao fazer logout:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Recupera senha
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'driverflow://reset-password',
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      logger.error('Erro ao recuperar senha:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualiza senha
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      logger.error('Erro ao atualizar senha:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Busca usuário atual
   */
  async getCurrentUser() {
    try {
      // Verificar se há sessão primeiro
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, user: null, error: null };
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      return { success: true, user, error: null };
    } catch (error) {
      // Não logar erro se for apenas falta de sessão (é esperado)
      if (error.message && error.message.includes('session')) {
        return { success: false, user: null, error: null };
      }
      logger.error('Erro ao buscar usuário:', error);
      return { success: false, user: null, error: error.message };
    }
  },

  /**
   * Busca sessão atual
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      return { success: true, session, error: null };
    } catch (error) {
      logger.error('Erro ao buscar sessão:', error);
      return { success: false, session: null, error: error.message };
    }
  },

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile(updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Atualizar metadata do auth
      const { error: authError } = await supabase.auth.updateUser({
        data: updates,
      });

      if (authError) throw authError;

      // Atualizar perfil na tabela user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      return { success: true, error: null };
    } catch (error) {
      logger.error('Erro ao atualizar perfil:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Verifica se está autenticado
   */
  async isAuthenticated() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      return false;
    }
  },

  /**
   * Listener de mudanças de autenticação
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  /**
   * Login com Google usando OAuth
   */
  async signInWithGoogle() {
    try {
      // Obter a URL de callback do app usando o scheme configurado
      const redirectUrl = Linking.createURL('/');
      
      logger.debug('Iniciando login com Google, redirectUrl:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Vamos abrir manualmente no React Native
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      // Abrir o navegador para autenticação
      if (data?.url) {
        logger.debug('Abrindo navegador para autenticação Google...');
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        logger.debug('Resultado do WebBrowser:', result.type);

        if (result.type === 'success') {
          // A URL de callback contém os parâmetros de autenticação
          const url = result.url;
          logger.debug('URL de callback recebida:', url);
          
          // Extrair os parâmetros da URL
          const parsedUrl = Linking.parse(url);
          logger.debug('URL parseada:', parsedUrl);
          
          // Verificar se há código ou token na URL
          if (parsedUrl.queryParams) {
            // O Supabase processará automaticamente via listener
            logger.debug('Parâmetros encontrados na URL de callback');
            return { success: true, data: result, error: null };
          }
        } else if (result.type === 'cancel') {
          return { success: false, data: null, error: 'Autenticação cancelada pelo usuário' };
        }

        return { success: false, data: null, error: 'Autenticação não completada' };
      }

      return { success: false, data: null, error: 'URL de autenticação não retornada' };
    } catch (error) {
      logger.error('Erro ao fazer login com Google:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Garante que o usuário tem perfil e organização criados
   * Chama a API do backend para criar se não existir
   */
  async ensureProfile() {
    try {
      // Obter sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logger.error('Erro ao obter sessão:', sessionError);
        return { success: false, error: 'Erro ao obter sessão de autenticação' };
      }

      if (!sessionData?.session) {
        logger.error('Nenhuma sessão encontrada');
        return { success: false, error: 'Usuário não autenticado - nenhuma sessão encontrada' };
      }

      const accessToken = sessionData.session.access_token;
      
      if (!accessToken) {
        logger.error('Token de acesso não encontrado na sessão');
        return { success: false, error: 'Token de acesso não disponível' };
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 
                     Constants.expoConfig?.extra?.apiUrl || 
                     'http://localhost:3000';

      logger.debug('Chamando API ensure-profile, URL:', `${API_URL}/api/auth/ensure-profile`);
      logger.debug('Token disponível:', !!accessToken);

      const response = await fetch(`${API_URL}/api/auth/ensure-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        logger.error('Erro na resposta da API:', response.status, errorData);
        return { success: false, error: errorData.error || errorData.message || `Erro HTTP ${response.status}` };
      }

      const result = await response.json();
      
      if (result.success) {
        logger.debug('Perfil criado com sucesso:', result.organizationId);
        return { success: true, organizationId: result.organizationId };
      } else {
        logger.error('API retornou erro:', result.error);
        return { success: false, error: result.error || 'Erro ao criar perfil' };
      }
    } catch (error) {
      logger.error('Erro ao garantir perfil:', error);
      return { success: false, error: error.message || 'Erro ao conectar com o servidor' };
    }
  },
};

export default AuthService;

