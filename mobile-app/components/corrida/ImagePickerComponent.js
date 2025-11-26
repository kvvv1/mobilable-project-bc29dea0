import React from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Button from '../Button';
import Card from '../Card';

export default function ImagePickerComponent({ image, onImageSelected, onImageRemoved }) {
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar sua câmera.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  return (
    <Card>
      <Text style={styles.sectionTitle}>Foto da Proposta</Text>
      <View style={styles.imageContainer}>
        {image ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.image} />
            <Button
              title="Remover Foto"
              variant="outline"
              onPress={onImageRemoved}
              style={styles.removeButton}
              icon={<Ionicons name="trash-outline" size={18} color="#6BBD9B" />}
              accessibilityLabel="Remover foto selecionada"
              accessibilityHint="Toque duas vezes para remover a foto atual"
            />
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
            <Text style={styles.imagePlaceholderText}>
              Tire uma foto ou escolha da galeria
            </Text>
            <Text style={styles.imagePlaceholderSubtext}>
              Isso ajuda a manter um registro visual das suas corridas
            </Text>
            <View style={styles.imageButtons}>
              <Button
                title="Tirar Foto"
                onPress={takePhoto}
                variant="outline"
                style={styles.imageButton}
                icon={<Ionicons name="camera" size={18} color="#6BBD9B" />}
                accessibilityLabel="Tirar foto da proposta de corrida"
                accessibilityHint="Toque duas vezes para abrir a câmera e tirar uma foto"
              />
              <Button
                title="Escolher"
                onPress={pickImage}
                variant="outline"
                style={styles.imageButton}
                icon={<Ionicons name="images-outline" size={18} color="#6BBD9B" />}
                accessibilityLabel="Escolher imagem da galeria"
                accessibilityHint="Toque duas vezes para abrir a galeria e selecionar uma foto"
              />
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  imageContainer: {
    marginTop: 8,
  },
  imageWrapper: {
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'contain',
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  imageButton: {
    flex: 1,
  },
});




