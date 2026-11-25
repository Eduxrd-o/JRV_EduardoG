// @ts-check
const ionic = require('@ionic/eslint-config/recommended');
const angular = require('angular-eslint');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ['www/**', 'dist/**', 'coverage/**', '.angular/**', 'android/**', 'ios/**', 'supabase/**'],
  },
  ionic,
  {
    files: ['**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/component-class-suffix': [
        'error',
        {
          suffixes: ['Page', 'Component'],
        },
      ],
    },
  },
  {
    // ADR-004: La capa de presentación (features) nunca importa Supabase ni data directamente.
    files: ['src/app/features/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@supabase/*'],
              message: 'ADR-004: Las páginas/features no pueden importar @supabase/* directamente. Usa los servicios/puertos.',
            },
            {
              group: ['**/data/**'],
              message: 'ADR-004: Las features no pueden importar implementaciones de data/. Inyecta el puerto de domain/ports.',
            },
          ],
        },
      ],
    },
  },
  {
    // ADR-004: La capa de dominio es TypeScript puro, sin dependencias de Angular, Ionic, Capacitor ni Supabase.
    files: ['src/app/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@angular/*', '@ionic/*', '@capacitor/*', '@supabase/*'],
              message: 'ADR-004: src/app/domain/ debe ser TypeScript puro sin dependencias de frameworks ni backend.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
