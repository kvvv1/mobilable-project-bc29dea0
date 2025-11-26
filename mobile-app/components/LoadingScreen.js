import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function LoadingScreen() {
  const { theme } = useTheme();
  
  // Tentar carregar a logo, se não existir mostra apenas o texto
  let logoSource = null;
  try {
    logoSource = require('../assets/splash-icon.png');
  } catch (e) {
    // Logo não encontrada, continuar sem ela
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        {logoSource ? (
          <Image
            source={logoSource}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>Corrida Certa</Text>
          </View>
        )}
        <ActivityIndicator 
          size="large" 
          color="#FFFFFF" 
          style={styles.loader}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6BBD9B',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});

