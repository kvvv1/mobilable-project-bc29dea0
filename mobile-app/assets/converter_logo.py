#!/usr/bin/env python3
"""
Script para converter icon.jpeg para os formatos necessários do Expo.
Requer: pip install Pillow
"""

from PIL import Image
import os
import sys

def convert_logo():
    """Converte icon.jpeg para todos os formatos necessários."""
    
    input_file = "icon.jpeg"
    
    if not os.path.exists(input_file):
        print(f"❌ Erro: {input_file} não encontrado!")
        print("   Certifique-se de que o arquivo está na pasta mobile-app/assets/")
        return False
    
    try:
        # Abrir a imagem original
        print(f"📖 Lendo {input_file}...")
        img = Image.open(input_file)
        
        # Converter para RGB se necessário (JPEG não tem transparência)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # 1. icon.png - 1024x1024
        print("🔄 Criando icon.png (1024x1024)...")
        icon = img.resize((1024, 1024), Image.Resampling.LANCZOS)
        icon.save("icon.png", "PNG", optimize=True)
        print("✅ icon.png criado!")
        
        # 2. splash-icon.png - 1024x1024 (mesmo arquivo)
        print("🔄 Criando splash-icon.png (1024x1024)...")
        icon.save("splash-icon.png", "PNG", optimize=True)
        print("✅ splash-icon.png criado!")
        
        # 3. adaptive-icon.png - 1024x1024 (mesmo arquivo)
        print("🔄 Criando adaptive-icon.png (1024x1024)...")
        icon.save("adaptive-icon.png", "PNG", optimize=True)
        print("✅ adaptive-icon.png criado!")
        
        # 4. favicon.png - 96x96
        print("🔄 Criando favicon.png (96x96)...")
        favicon = img.resize((96, 96), Image.Resampling.LANCZOS)
        favicon.save("favicon.png", "PNG", optimize=True)
        print("✅ favicon.png criado!")
        
        print("\n🎉 Conversão concluída com sucesso!")
        print("\n⚠️  IMPORTANTE:")
        print("   - Todos os arquivos foram criados com 1024x1024 pixels")
        print("   - Para melhor resultado, edite splash-icon.png e adaptive-icon.png")
        print("     para ter fundo transparente (se necessário)")
        print("   - O favicon.png foi criado com 96x96 pixels")
        
        return True
        
    except ImportError:
        print("❌ Erro: Biblioteca Pillow não encontrada!")
        print("   Instale com: pip install Pillow")
        return False
    except Exception as e:
        print(f"❌ Erro durante a conversão: {e}")
        return False

if __name__ == "__main__":
    # Mudar para o diretório do script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    convert_logo()

