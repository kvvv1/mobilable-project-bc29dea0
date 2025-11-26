import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import TipoDespesaSelector from '../components/despesa/TipoDespesaSelector';
import DespesaForm from '../components/despesa/DespesaForm';
import DespesaPreview from '../components/despesa/DespesaPreview';
import TemplatesList from '../components/despesa/TemplatesList';
import HistoricoRapidoDespesa from '../components/despesa/HistoricoRapidoDespesa';
import { StorageService } from '../services/storage';
import { TemplatesService } from '../services/templatesService';
import { Validators } from '../utils/validators';
import { Masks } from '../utils/masks';

export default function AdicionarDespesaScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [tipo, setTipo] = useState('combustivel');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const salvarDespesa = async () => {
    // Validação
    const validation = Validators.validateDespesa({
      tipo,
      valor,
      descricao,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios corretamente.');
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const valorNum = Masks.unformatMoney(valor);

      const despesa = {
        tipo,
        valor: valorNum,
        descricao: descricao.trim(),
      };

      await StorageService.saveDespesa(despesa);
      Alert.alert('Sucesso', 'Despesa registrada com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      Alert.alert('Erro', 'Não foi possível salvar a despesa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
          <View style={styles.titleContainer}>
            <Ionicons name="cash-outline" size={24} color={theme.colors.text} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Adicionar Despesa</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Registre todas as suas despesas para manter o controle
          </Text>
        </View>

        <TemplatesList
          onSelectTemplate={(template) => {
            setTipo(template.tipo);
            setValor(Masks.money(template.valor?.toString() || '0'));
            setDescricao(template.descricao || '');
          }}
          onSaveAsTemplate={async () => {
            if (!valor || !descricao) {
              Alert.alert('Atenção', 'Preencha valor e descrição antes de salvar como template.');
              return;
            }
            Alert.prompt(
              'Salvar Template',
              'Digite um nome para este template:',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Salvar',
                  onPress: async (nome) => {
                    if (nome && nome.trim()) {
                      await TemplatesService.saveTemplate({
                        nome: nome.trim(),
                        tipo,
                        valor: Masks.unformatMoney(valor),
                        descricao,
                      });
                      Alert.alert('Sucesso', 'Template salvo com sucesso!');
                    }
                  },
                },
              ],
              'plain-text'
            );
          }}
        />

        <TipoDespesaSelector selected={tipo} onSelect={setTipo} />

        <HistoricoRapidoDespesa
          tipo={tipo}
          onSelectDespesa={(despesa) => {
            setTipo(despesa.tipo);
            setValor(Masks.money(despesa.valor?.toString() || '0'));
            setDescricao(despesa.descricao || '');
          }}
        />

        <DespesaForm
          valor={valor}
          onValorChange={setValor}
          descricao={descricao}
          onDescricaoChange={setDescricao}
          tipo={tipo}
          errors={errors}
        />

        <DespesaPreview tipo={tipo} valor={valor} descricao={descricao} />

        <View style={styles.footer}>
          <Button
            title="Salvar Despesa"
            onPress={salvarDespesa}
            loading={loading}
            style={styles.saveButton}
            disabled={!valor || !descricao}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
  },
  saveButton: {
    width: '100%',
  },
});
