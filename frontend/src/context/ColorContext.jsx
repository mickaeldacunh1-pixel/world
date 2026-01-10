import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const ColorContext = createContext();

// Convertir HEX en HSL
function hexToHSL(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: h = 0;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function ColorProvider({ children }) {
  const [colors, setColors] = useState({
    primary: '#1E3A5F',
    accent: '#F97316',
    text: '#0F172A',
    background: '#FFFFFF'
  });

  useEffect(() => {
    // Charger les couleurs depuis les settings
    const loadColors = async () => {
      try {
        const response = await axios.get(`${API}/settings`);
        const settings = response.data;
        
        if (settings.color_primary || settings.color_accent) {
          setColors({
            primary: settings.color_primary || '#1E3A5F',
            accent: settings.color_accent || '#F97316',
            text: settings.color_text || '#0F172A',
            background: settings.color_background || '#FFFFFF'
          });
        }
      } catch (error) {
        console.error('Error loading colors:', error);
      }
    };

    loadColors();
  }, []);

  // Appliquer les couleurs au document
  useEffect(() => {
    const root = document.documentElement;
    
    // Convertir et appliquer la couleur primaire
    if (colors.primary) {
      const primaryHSL = hexToHSL(colors.primary);
      root.style.setProperty('--primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
    }
    
    // Convertir et appliquer la couleur accent
    if (colors.accent) {
      const accentHSL = hexToHSL(colors.accent);
      root.style.setProperty('--accent', `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`);
    }
    
    // Couleur de texte
    if (colors.text) {
      const textHSL = hexToHSL(colors.text);
      root.style.setProperty('--foreground', `${textHSL.h} ${textHSL.s}% ${textHSL.l}%`);
    }
    
    // Couleur de fond
    if (colors.background) {
      const bgHSL = hexToHSL(colors.background);
      root.style.setProperty('--background', `${bgHSL.h} ${bgHSL.s}% ${bgHSL.l}%`);
    }
  }, [colors]);

  const updateColors = (newColors) => {
    setColors(prev => ({ ...prev, ...newColors }));
  };

  return (
    <ColorContext.Provider value={{ colors, updateColors }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColors() {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error('useColors must be used within a ColorProvider');
  }
  return context;
}
