import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';
import ImagePickerComponent from '../components/corrida/ImagePickerComponent';
import CorridaForm from '../components/corrida/CorridaForm';
import ViabilidadeCard from '../components/corrida/ViabilidadeCard';
import HistoricoRapido from '../components/corrida/HistoricoRapido';
import { StorageService } from '../services/storage';
import AnaliseService from '../services/analiseCorridas';
import { Validators } from '../utils/validators';
import { Masks } from '../utils/masks';

export default function CapturarCorridaScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState(null);
  const [plataforma, setPlataforma] = useState('uber');
  const [valor, setValor] = useState('');
  const [distancia, setDistancia] = useState('');
  const [tempoEstimado, setTempoEstimado] = useState('');
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [analise, setAnalise] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (valor && distancia && tempoEstimado && config) {
      calcularAnalise();
    } else {
      setAnalise(null);
    }
  }, [valor, distancia, tempoEstimado, config, plataforma]);

  const loadConfig = async () => {
    const configData = await StorageService.getConfig();
    setConfig(configData);
  };

  const calcularAnalise = () => {
    const valorNum = Masks.unformatMoney(valor);
    const distanciaNum = Masks.unformatDecimal(distancia);
    const tempoNum = parseFloat(tempoEstimado);

    if (!valorNum || !distanciaNum || !tempoNum || !config) return;

    const corrida = {
      plataforma,
      valor: valorNum,
      distancia: distanciaNum,
      tempoEstimado: tempoNum,
    };

    const analiseData = AnaliseService.analisarViabilidade(corrida, config);
    setAnalise(analiseData);
  };

  const salvarCorrida = async () => {
    // Validação
    const validation = Validators.validateCorrida({
      plataforma,
      valor,
      distancia,
      tempoEstimado,
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
      const distanciaNum = Masks.unformatDecimal(distancia);
      const tempoNum = parseFloat(tempoEstimado);

      const corrida = {
        plataforma,
        valor: valorNum,
        distancia: distanciaNum,
        tempoEstimado: tempoNum,
        origem: origem.trim() || null,
        destino: destino.trim() || null,
        imagem: image || null,
        analise: analise,
      };

      await StorageService.saveCorrida(corrida);
      Alert.alert('Sucesso', 'Corrida registrada com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Erro ao salvar corrida:', error);
      Alert.alert('Erro', 'Não foi possível salvar a corrida.');
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
          <Text style={styles.title}>Capturar Corrida</Text>
          <Text style={styles.subtitle}>
            Tire uma foto da proposta ou preencha manualmente
          </Text>
        </View>

        <HistoricoRapido
          onSelectCorrida={(corrida) => {
            setPlataforma(corrida.plataforma || 'uber');
            setValor(Masks.money(corrida.valor?.toString() || '0'));
            setDistancia(Masks.decimal(corrida.distancia?.toString() || '0', 1));
            setTempoEstimado(corrida.tempoEstimado?.toString() || '');
            setOrigem(corrida.origem || '');
            setDestino(corrida.destino || '');
          }}
        />

        <ImagePickerComponent
          image={image}
          onImageSelected={setImage}
          onImageRemoved={() => setImage(null)}
        />

        <CorridaForm
          plataforma={plataforma}
          onPlataformaChange={setPlataforma}
          valor={valor}
          onValorChange={setValor}
          distancia={distancia}
          onDistanciaChange={setDistancia}
          tempoEstimado={tempoEstimado}
          onTempoEstimadoChange={setTempoEstimado}
          origem={origem}
          onOrigemChange={setOrigem}
          destino={destino}
          onDestinoChange={setDestino}
          errors={errors}
        />

        <ViabilidadeCard analise={analise} />

        <View style={styles.footer}>
          <Button
            title="Salvar Corrida"
            onPress={salvarCorrida}
            loading={loading}
            style={styles.saveButton}
            disabled={!valor || !distancia || !tempoEstimado}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
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
