import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';
import { TemplatesService } from '../../services/templatesService';
import { Formatters } from '../../utils/formatters';

export default function TemplatesList({ onSelectTemplate, onSaveAsTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await TemplatesService.getTemplatesMaisUsados(5);
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (template) => {
    await TemplatesService.incrementarUso(template.id);
    onSelectTemplate(template);
    loadTemplates(); // Recarrega para atualizar ordem
  };

  const handleDelete = (template) => {
    Alert.alert(
      'Excluir Template',
      `Deseja excluir o template "${template.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await TemplatesService.deleteTemplate(template.id);
            loadTemplates();
          },
        },
      ]
    );
  };

  if (loading || templates.length === 0) {
    return null;
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Templates Rápidos</Text>
        <TouchableOpacity onPress={onSaveAsTemplate}>
          <Ionicons name="add-circle-outline" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>
      <View style={styles.templatesList}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateItem}
            onPress={() => handleSelect(template)}
            onLongPress={() => handleDelete(template)}
          >
            <View style={styles.templateContent}>
              <Text style={styles.templateNome}>{template.nome}</Text>
              <Text style={styles.templateInfo}>
                {Formatters.currency(template.valor)} • {template.tipo}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>
        💡 Toque para usar • Pressione e segure para excluir
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  templatesList: {
    gap: 12,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateContent: {
    flex: 1,
  },
  templateNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  templateInfo: {
    fontSize: 12,
    color: '#6B7280',
  },
  hint: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
});


