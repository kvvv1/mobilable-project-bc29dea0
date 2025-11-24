import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';

// URL da política de privacidade (atualize quando hospedar)
const PRIVACY_POLICY_URL = 'https://seu-dominio.com/privacy-policy';

export default function PrivacyPolicyScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const openPrivacyPolicyURL = async () => {
    try {
      const supported = await Linking.canOpenURL(PRIVACY_POLICY_URL);
      if (supported) {
        await Linking.openURL(PRIVACY_POLICY_URL);
      } else {
        alert('Não foi possível abrir o link. Por favor, verifique sua conexão.');
      }
    } catch (error) {
      console.error('Erro ao abrir política de privacidade:', error);
      alert('Erro ao abrir o link.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidade</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={48} color="#10B981" />
          </View>
          <Text style={styles.title}>Política de Privacidade</Text>
          <Text style={styles.subtitle}>DriverFlow - Gestão para Motoristas</Text>
          <Text style={styles.version}>Versão 1.0.0</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🔒 Sua Privacidade é Importante</Text>
          <Text style={styles.text}>
            O DriverFlow valoriza sua privacidade e está comprometido em proteger
            suas informações pessoais. Esta política descreve como coletamos,
            usamos e protegemos seus dados.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>📱 Informações que Coletamos</Text>
          <Text style={styles.text}>
            O DriverFlow armazena apenas os dados que você fornece manualmente:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Dados de corridas (valor, distância, tempo)</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Despesas e receitas</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Imagens capturadas por você</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.listText}>Configurações do aplicativo</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>💾 Armazenamento Local</Text>
          <Text style={styles.text}>
            Todos os seus dados são armazenados exclusivamente no seu dispositivo.
            Não enviamos dados para servidores externos. Não compartilhamos
            informações com terceiros.
          </Text>
          <View style={styles.highlightBox}>
            <Ionicons name="lock-closed" size={24} color="#8B5CF6" />
            <Text style={styles.highlightText}>
              Processamento 100% local. Seus dados nunca saem do seu dispositivo.
            </Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>📸 Permissões</Text>
          <Text style={styles.text}>
            O DriverFlow solicita apenas as permissões necessárias:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="camera" size={20} color="#3B82F6" />
            <Text style={styles.listText}>
              <Text style={styles.bold}>Câmera:</Text> Para capturar fotos de propostas de corrida
            </Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="images" size={20} color="#3B82F6" />
            <Text style={styles.listText}>
              <Text style={styles.bold}>Armazenamento:</Text> Para salvar e acessar imagens
            </Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🔐 Segurança</Text>
          <Text style={styles.text}>
            Usamos mecanismos nativos de segurança do sistema operacional para
            proteger seus dados. Todas as informações são armazenadas localmente
            e criptografadas quando possível.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🎯 Seus Direitos</Text>
          <Text style={styles.text}>
            Você tem total controle sobre seus dados:
          </Text>
          <View style={styles.listItem}>
            <Ionicons name="eye" size={20} color="#8B5CF6" />
            <Text style={styles.listText}>Visualizar todos os seus dados</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="create" size={20} color="#8B5CF6" />
            <Text style={styles.listText}>Editar ou atualizar informações</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={styles.listText}>Excluir dados individuais ou todos</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>❌ O que NÃO fazemos</Text>
          <View style={styles.listItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.listText}>Não enviamos dados para servidores</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.listText}>Não rastreamos sua localização</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.listText}>Não acessamos outros aplicativos</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.listText}>Não compartilhamos com terceiros</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>📄 Política Completa</Text>
          <Text style={styles.text}>
            Para ler a política de privacidade completa e detalhada, visite nosso site:
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={openPrivacyPolicyURL}
          >
            <Ionicons name="link" size={20} color="#8B5CF6" />
            <Text style={styles.linkText}>Ver Política de Privacidade Completa</Text>
            <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            Nota: Atualize a URL da política no código antes de publicar na Play Store.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>📧 Contato</Text>
          <Text style={styles.text}>
            Se você tiver dúvidas sobre esta política de privacidade, entre em contato:
          </Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={20} color="#8B5CF6" />
            <Text style={styles.contactText}>contato@driverflow.app</Text>
          </View>
          <Text style={styles.disclaimer}>
            Nota: Atualize o email de contato no código antes de publicar.
          </Text>
        </Card>

        <Card style={styles.lastUpdateCard}>
          <Text style={styles.lastUpdateText}>
            Última atualização: {new Date().toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </Card>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  version: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: '#111827',
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 20,
    fontWeight: '500',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginLeft: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  lastUpdateCard: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    padding: 16,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  footer: {
    height: 40,
  },
});


