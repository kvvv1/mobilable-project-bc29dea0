import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';
import { StorageService } from '../services/storage';
import AnaliseService from '../services/analiseCorridas';
import { Formatters } from '../utils/formatters';
// ProgressBar será implementado manualmente

const META_KEYS = {
  RECEITA_DIARIA: 'metaReceitaDiaria',
  RECEITA_MENSAL: 'metaReceitaMensal',
  CORRIDAS_DIARIAS: 'metaCorridasDiarias',
  CORRIDAS_MENSAIS: 'metaCorridasMensais',
};

export default function MetasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [metas, setMetas] = useState({
    receitaDiaria: '',
    receitaMensal: '',
    corridasDiarias: '',
    corridasMensais: '',
  });
  const [progresso, setProgresso] = useState({
    receitaDiaria: 0,
    receitaMensal: 0,
    corridasDiarias: 0,
    corridasMensais: 0,
  });
  const [estatisticas, setEstatisticas] = useState({
    receitaHoje: 0,
    receitaMes: 0,
    corridasHoje: 0,
    corridasMes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      // Carregar metas salvas
      const receitaDiaria = await StorageService.getItem(META_KEYS.RECEITA_DIARIA);
      const receitaMensal = await StorageService.getItem(META_KEYS.RECEITA_MENSAL);
      const corridasDiarias = await StorageService.getItem(META_KEYS.CORRIDAS_DIARIAS);
      const corridasMensais = await StorageService.getItem(META_KEYS.CORRIDAS_MENSAIS);
      
      const metasSalvas = {
        receitaDiaria: receitaDiaria || '',
        receitaMensal: receitaMensal || '',
        corridasDiarias: corridasDiarias || '',
        corridasMensais: corridasMensais || '',
      };
      setMetas(metasSalvas);

      // Carregar estatísticas
      const stats = await AnaliseService.calcularEstatisticas();
      const corridas = await StorageService.getCorridas();
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      const corridasHoje = corridas.filter(c => new Date(c.createdAt) >= hoje);
      const corridasMes = corridas.filter(c => new Date(c.createdAt) >= inicioMes);

      const receitaHoje = corridasHoje.reduce((sum, c) => sum + (c.valor || 0), 0);
      const receitaMes = corridasMes.reduce((sum, c) => sum + (c.valor || 0), 0);

      const novasEstatisticas = {
        receitaHoje,
        receitaMes,
        corridasHoje: corridasHoje.length,
        corridasMes: corridasMes.length,
      };
      setEstatisticas(novasEstatisticas);

      // Calcular progresso
      setProgresso({
        receitaDiaria: metasSalvas.receitaDiaria 
          ? (receitaHoje / parseFloat(metasSalvas.receitaDiaria)) * 100 
          : 0,
        receitaMensal: metasSalvas.receitaMensal 
          ? (receitaMes / parseFloat(metasSalvas.receitaMensal)) * 100 
          : 0,
        corridasDiarias: metasSalvas.corridasDiarias 
          ? (corridasHoje.length / parseFloat(metasSalvas.corridasDiarias)) * 100 
          : 0,
        corridasMensais: metasSalvas.corridasMensais 
          ? (corridasMes.length / parseFloat(metasSalvas.corridasMensais)) * 100 
          : 0,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarMeta = async (key, valor) => {
    try {
      await StorageService.setItem(key, valor);
      Alert.alert('Sucesso', 'Meta salva com sucesso!');
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a meta.');
    }
  };

  const getProgressColor = (progresso) => {
    if (progresso >= 100) return '#10B981';
    if (progresso >= 75) return '#22C55E';
    if (progresso >= 50) return '#EAB308';
    if (progresso >= 25) return '#F97316';
    return '#EF4444';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Metas e Objetivos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Meta de Receita Diária */}
        <Card style={styles.metaCard}>
          <View style={styles.metaHeader}>
            <View style={styles.metaIconContainer}>
              <Ionicons name="cash" size={24} color="#10B981" />
            </View>
            <View style={styles.metaHeaderText}>
              <Text style={styles.metaTitle}>Receita Diária</Text>
              <Text style={styles.metaSubtitle}>
                {Formatters.currency(estatisticas.receitaHoje)} de{' '}
                {metas.receitaDiaria ? Formatters.currency(parseFloat(metas.receitaDiaria)) : 'R$ 0,00'}
              </Text>
            </View>
          </View>

          {metas.receitaDiaria && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progresso</Text>
                <Text style={[
                  styles.progressValue,
                  { color: getProgressColor(progresso.receitaDiaria) }
                ]}>
                  {Math.min(progresso.receitaDiaria, 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progresso.receitaDiaria, 100)}%`,
                    backgroundColor: getProgressColor(progresso.receitaDiaria),
                  }
                ]} />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite a meta (R$)"
              value={metas.receitaDiaria}
              onChangeText={(text) => setMetas({ ...metas, receitaDiaria: text })}
              keyboardType="decimal-pad"
            />
            <Button
              title="Salvar"
              onPress={() => salvarMeta(META_KEYS.RECEITA_DIARIA, metas.receitaDiaria)}
              style={styles.saveButton}
              textStyle={{ fontSize: 12 }}
            />
          </View>
        </Card>

        {/* Meta de Receita Mensal */}
        <Card style={styles.metaCard}>
          <View style={styles.metaHeader}>
            <View style={styles.metaIconContainer}>
              <Ionicons name="calendar" size={24} color="#3B82F6" />
            </View>
            <View style={styles.metaHeaderText}>
              <Text style={styles.metaTitle}>Receita Mensal</Text>
              <Text style={styles.metaSubtitle}>
                {Formatters.currency(estatisticas.receitaMes)} de{' '}
                {metas.receitaMensal ? Formatters.currency(parseFloat(metas.receitaMensal)) : 'R$ 0,00'}
              </Text>
            </View>
          </View>

          {metas.receitaMensal && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progresso</Text>
                <Text style={[
                  styles.progressValue,
                  { color: getProgressColor(progresso.receitaMensal) }
                ]}>
                  {Math.min(progresso.receitaMensal, 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progresso.receitaMensal, 100)}%`,
                    backgroundColor: getProgressColor(progresso.receitaMensal),
                  }
                ]} />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite a meta (R$)"
              value={metas.receitaMensal}
              onChangeText={(text) => setMetas({ ...metas, receitaMensal: text })}
              keyboardType="decimal-pad"
            />
            <Button
              title="Salvar"
              onPress={() => salvarMeta(META_KEYS.RECEITA_MENSAL, metas.receitaMensal)}
              style={styles.saveButton}
              textStyle={{ fontSize: 12 }}
            />
          </View>
        </Card>

        {/* Meta de Corridas Diárias */}
        <Card style={styles.metaCard}>
          <View style={styles.metaHeader}>
            <View style={styles.metaIconContainer}>
              <Ionicons name="car" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.metaHeaderText}>
              <Text style={styles.metaTitle}>Corridas Diárias</Text>
              <Text style={styles.metaSubtitle}>
                {estatisticas.corridasHoje} de {metas.corridasDiarias || 0} corridas
              </Text>
            </View>
          </View>

          {metas.corridasDiarias && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progresso</Text>
                <Text style={[
                  styles.progressValue,
                  { color: getProgressColor(progresso.corridasDiarias) }
                ]}>
                  {Math.min(progresso.corridasDiarias, 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progresso.corridasDiarias, 100)}%`,
                    backgroundColor: getProgressColor(progresso.corridasDiarias),
                  }
                ]} />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite a meta (número)"
              value={metas.corridasDiarias}
              onChangeText={(text) => setMetas({ ...metas, corridasDiarias: text })}
              keyboardType="number-pad"
            />
            <Button
              title="Salvar"
              onPress={() => salvarMeta(META_KEYS.CORRIDAS_DIARIAS, metas.corridasDiarias)}
              style={styles.saveButton}
              textStyle={{ fontSize: 12 }}
            />
          </View>
        </Card>

        {/* Meta de Corridas Mensais */}
        <Card style={styles.metaCard}>
          <View style={styles.metaHeader}>
            <View style={styles.metaIconContainer}>
              <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
            </View>
            <View style={styles.metaHeaderText}>
              <Text style={styles.metaTitle}>Corridas Mensais</Text>
              <Text style={styles.metaSubtitle}>
                {estatisticas.corridasMes} de {metas.corridasMensais || 0} corridas
              </Text>
            </View>
          </View>

          {metas.corridasMensais && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progresso</Text>
                <Text style={[
                  styles.progressValue,
                  { color: getProgressColor(progresso.corridasMensais) }
                ]}>
                  {Math.min(progresso.corridasMensais, 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progresso.corridasMensais, 100)}%`,
                    backgroundColor: getProgressColor(progresso.corridasMensais),
                  }
                ]} />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite a meta (número)"
              value={metas.corridasMensais}
              onChangeText={(text) => setMetas({ ...metas, corridasMensais: text })}
              keyboardType="number-pad"
            />
            <Button
              title="Salvar"
              onPress={() => salvarMeta(META_KEYS.CORRIDAS_MENSAIS, metas.corridasMensais)}
              style={styles.saveButton}
              textStyle={{ fontSize: 12 }}
            />
          </View>
        </Card>

        {/* Card de Motivação */}
        {Object.values(progresso).some(p => p >= 100) && (
          <Card style={styles.motivacaoCard}>
            <Ionicons name="trophy" size={48} color="#F59E0B" />
            <Text style={styles.motivacaoTitle}>Parabéns! 🎉</Text>
            <Text style={styles.motivacaoText}>
              Você alcançou uma de suas metas! Continue assim!
            </Text>
          </Card>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  metaCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  metaHeaderText: {
    flex: 1,
  },
  metaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  metaSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  saveButton: {
    paddingHorizontal: 20,
    minWidth: 80,
  },
  motivacaoCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  motivacaoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  motivacaoText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    height: 40,
  },
});

