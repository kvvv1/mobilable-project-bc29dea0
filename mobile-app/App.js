import React, { useEffect } from 'react';
import { logger } from './utils/logger';
import { supabase } from './services/authService';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import LoadingScreen from './components/LoadingScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import DashboardScreen from './screens/DashboardScreen';
import CapturarCorridaScreen from './screens/CapturarCorridaScreen';
import AdicionarDespesaScreen from './screens/AdicionarDespesaScreen';
import RelatoriosScreen from './screens/RelatoriosScreen';
import ConfiguracoesScreen from './screens/ConfiguracoesScreen';
import ProfileScreen from './screens/ProfileScreen';
import HistoricoCorridasScreen from './screens/HistoricoCorridasScreen';
import MetasScreen from './screens/MetasScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import SelecionarVeiculoScreen from './screens/SelecionarVeiculoScreen';
import CadastrarVeiculoScreen from './screens/CadastrarVeiculoScreen';
import EnviarDadosScreen from './screens/EnviarDadosScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import TutorialScreen from './screens/TutorialScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack do Dashboard - Dashboard, Relatórios e Metas
function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6BBD9B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Relatorios"
        component={RelatoriosScreen}
        options={{
          title: 'Relatórios',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Metas"
        component={MetasScreen}
        options={{
          title: 'Metas e Objetivos',
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}

// Stack de Entradas - Capturar Corrida e Histórico
function EntradaStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6BBD9B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="CapturarCorrida"
        component={CapturarCorridaScreen}
        options={{
          title: 'Capturar Corrida',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HistoricoCorridas"
        component={HistoricoCorridasScreen}
        options={{
          title: 'Histórico de Corridas',
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}

// Stack de Saídas - Adicionar Despesa
function SaidasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6BBD9B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="AdicionarDespesa"
        component={AdicionarDespesaScreen}
        options={{
          title: 'Adicionar Despesa',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Stack de Perfil
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6BBD9B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HistoricoCorridas"
        component={HistoricoCorridasScreen}
        options={{
          title: 'Histórico de Corridas',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Metas"
        component={MetasScreen}
        options={{
          title: 'Metas e Objetivos',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="SelecionarVeiculo"
        component={SelecionarVeiculoScreen}
        options={{
          title: 'Selecionar Veículo',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="CadastrarVeiculo"
        component={CadastrarVeiculoScreen}
        options={{
          title: 'Cadastrar Veículo',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="EnviarDados"
        component={EnviarDadosScreen}
        options={{
          title: 'Enviar via WhatsApp',
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}

// Stack de Configurações
function ConfiguracoesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6BBD9B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Configuracoes"
        component={ConfiguracoesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          title: 'Política de Privacidade',
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}

// Componente wrapper para Login que redireciona se necessário
function LoginScreenWrapper({ navigation }) {
  const { isAuthenticated, onboardingCompleted, loading, user } = useAuth();
  const [hasRedirected, setHasRedirected] = React.useState(false);

  React.useEffect(() => {
    // Aguardar um pouco para que o Login apareça primeiro
    // Só verificar redirecionamento se não estiver carregando e estiver autenticado
    if (!loading && isAuthenticated && user && onboardingCompleted === false && !hasRedirected) {
      // Aguardar 500ms para que o usuário veja o Login primeiro
      const timer = setTimeout(() => {
        logger.debug('Usuário autenticado sem onboarding - redirecionando para Onboarding');
        setHasRedirected(true);
        navigation.replace('Onboarding');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, onboardingCompleted, loading, user, navigation, hasRedirected]);

  return <LoginScreen navigation={navigation} />;
}

// Stack de Autenticação - removido, agora gerenciado diretamente no AppContent
// Onboarding e Tutorial são gerenciados separadamente

function AppContent() {
  const { theme } = useTheme();
  const { isAuthenticated, onboardingCompleted, tutorialCompleted, loading, user } = useAuth();
  
  // Debug logs (apenas em desenvolvimento)
  useEffect(() => {
    logger.debug('AppContent State:', {
      isAuthenticated,
      onboardingCompleted,
      tutorialCompleted,
      loading,
      hasUser: !!user,
    });
  }, [isAuthenticated, onboardingCompleted, tutorialCompleted, loading, user]);
  
  if (loading) {
    return <LoadingScreen />;
  }

  // Determinar qual tela mostrar - FLUXO EXATO: LOGIN/CADASTRO → ONBOARDING → TUTORIAL → APP
  // IMPORTANTE: Sempre mostrar Login primeiro se onboarding não está completo
  // Isso garante que o usuário veja o Login mesmo se houver sessão salva
  const shouldShowLogin = !isAuthenticated || !onboardingCompleted;
  // Se autenticado E onboarding completo MAS tutorial não completo -> mostrar Tutorial
  const shouldShowTutorial = isAuthenticated && onboardingCompleted && !tutorialCompleted;
  // Se tudo completo -> mostrar App principal (Dashboard)
  const shouldShowApp = isAuthenticated && onboardingCompleted && tutorialCompleted;

  logger.debug('Navegação - isAuthenticated:', isAuthenticated, 'onboardingCompleted:', onboardingCompleted, 'tutorialCompleted:', tutorialCompleted);
  logger.debug('Navegação - Login:', shouldShowLogin, 'Tutorial:', shouldShowTutorial, 'App:', shouldShowApp);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
        <NavigationContainer>
          {shouldShowLogin ? (
            <>
              {/* Mostrar Login/SignUp quando não autenticado OU quando onboarding não completo */}
              {/* Se autenticado mas sem onboarding, o LoginScreenWrapper vai redirecionar para Onboarding */}
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  presentation: 'card',
                }}
                initialRouteName="Login"
              >
                <Stack.Screen name="Login" component={LoginScreenWrapper} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              </Stack.Navigator>
              <StatusBar style="light" />
            </>
          ) : shouldShowTutorial ? (
            <>
              {/* Tutorial Stack - aparece apenas uma vez após onboarding */}
              <Stack.Navigator 
                screenOptions={{ headerShown: false }}
                initialRouteName="Tutorial"
              >
                <Stack.Screen 
                  name="Tutorial" 
                  component={TutorialScreen}
                  options={{ gestureEnabled: false }} // Impede voltar durante tutorial
                />
              </Stack.Navigator>
              <StatusBar style="light" />
            </>
          ) : shouldShowApp ? (
            <>
              <Tab.Navigator
                screenOptions={({ route }) => ({
                  tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                      iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Entrada') {
                      iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Saidas') {
                      iconName = focused ? 'remove-circle' : 'remove-circle-outline';
                    } else if (route.name === 'Profile') {
                      iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'Configuracoes') {
                      iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                  },
                  tabBarActiveTintColor: '#6BBD9B',
                  tabBarInactiveTintColor: '#9CA3AF',
                  tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                  },
                  headerShown: false,
                })}
              >
                <Tab.Screen
                  name="Dashboard"
                  component={DashboardStack}
                  options={{ title: 'Dashboard' }}
                />
                <Tab.Screen
                  name="Entrada"
                  component={EntradaStack}
                  options={{ title: 'Entrada' }}
                />
                <Tab.Screen
                  name="Saidas"
                  component={SaidasStack}
                  options={{ title: 'Saídas' }}
                />
                <Tab.Screen
                  name="Profile"
                  component={ProfileStack}
                  options={{ title: 'Perfil' }}
                />
                <Tab.Screen
                  name="Configuracoes"
                  component={ConfiguracoesStack}
                  options={{ title: 'Configurações' }}
                />
              </Tab.Navigator>
              <StatusBar style="light" />
            </>
          ) : (
            // Fallback: mostrar loading se nenhuma condição for verdadeira
            <LoadingScreen />
          )}
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
