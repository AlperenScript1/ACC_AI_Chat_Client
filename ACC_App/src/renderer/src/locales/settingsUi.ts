import { AUTO_CLOSE_TIMEOUT_VALUES } from '../lib/autoCloseTimeout'

/** UI locale for the settings panel (extend when adding languages). */
export type SettingsUiLocale = 'en' | 'tr'

export type SleepSelectOption = { value: number; label: string }

export type SettingsUiCopy = {
  panelTitle: string
  sectionAppearance: string
  theme: string
  themeDark: string
  themeLight: string
  animations: string
  stateOn: string
  stateOff: string
  sectionWindow: string
  windowBounds: string
  windowBoundsHint: string
  sectionShortcuts: string
  searchShortcut: string
  searchShortcutHint: string
  homeShortcut: string
  homeShortcutHint: string
  resetShortcut: string
  sleepTitle: string
  sleepDescription: string
  sleepOptionLabel: (minutes: number) => string
  sectionDanger: string
  dangerDeleteAll: string
  dangerConfirmBody: string
  dangerCancel: string
  dangerDelete: string
  dangerWarningBody: string
  dangerConfirmClose: string
  gearTitle: string
  gearAria: string
}

const en: SettingsUiCopy = {
  panelTitle: 'Settings',
  sectionAppearance: 'Appearance',
  theme: 'Theme',
  themeDark: 'Dark',
  themeLight: 'Light',
  animations: 'Animations',
  stateOn: 'On',
  stateOff: 'Off',
  sectionWindow: 'Window',
  windowBounds: 'Restrict window size',
  windowBoundsHint: 'When turned off, the window can be resized freely.',
  sectionShortcuts: 'Shortcuts & performance',
  searchShortcut: 'Search shortcut',
  searchShortcutHint: 'Click the field and press a combination (e.g. Ctrl+K).',
  homeShortcut: 'Home shortcut',
  homeShortcutHint: 'Click the field and press a combination (e.g. Ctrl+Shift+H).',
  resetShortcut: 'Reset',
  sleepTitle: 'Automatic sleep',
  sleepDescription:
    'If a background model has no interaction for the selected time, it enters sleep mode and its webview is unloaded to free memory. 30 minutes is a good default.',
  sleepOptionLabel: (minutes: number) => {
    switch (minutes) {
      case -5:
        return '5 seconds (test)'
      case 10:
        return '10 minutes'
      case 30:
        return '30 minutes (recommended)'
      case 60:
        return '1 hour'
      case 120:
        return '2 hours'
      case 180:
        return '3 hours (not recommended for performance)'
      default:
        return `${minutes} minutes`
    }
  },
  sectionDanger: 'Danger zone',
  dangerDeleteAll: 'Delete all data',
  dangerConfirmBody:
    'Are you sure? All settings, models, and chat history will be permanently deleted.',
  dangerCancel: 'Cancel',
  dangerDelete: 'Delete',
  dangerWarningBody:
    'The application will close after all data has been deleted. Do you want to continue?',
  dangerConfirmClose: 'Yes, close',
  gearTitle: 'Settings',
  gearAria: 'Settings'
}

const tr: SettingsUiCopy = {
  panelTitle: 'Ayarlar',
  sectionAppearance: 'Görünüm',
  theme: 'Tema',
  themeDark: 'Karanlık',
  themeLight: 'Aydınlık',
  animations: 'Animasyonlar',
  stateOn: 'Açık',
  stateOff: 'Kapalı',
  sectionWindow: 'Pencere',
  windowBounds: 'Pencere boyutu kısıtlaması',
  windowBoundsHint: 'Kapatıldığında pencere serbestçe boyutlandırılabilir.',
  sectionShortcuts: 'Kısayollar ve performans',
  searchShortcut: 'Arama kısayolu',
  searchShortcutHint: 'Değiştirmek için alana tıklayıp kombinasyonu bas (ör. Ctrl+K).',
  homeShortcut: 'Home kısayolu',
  homeShortcutHint: 'Değiştirmek için alana tıklayıp kombinasyonu bas (ör. Ctrl+Shift+H).',
  resetShortcut: 'Sıfırla',
  sleepTitle: 'Otomatik uyku modu',
  sleepDescription:
    'Belirtilen süre boyunca etkileşim olmazsa model uyku moduna geçer; webview kaldırılarak bellek boşaltılır. Performans için önerilen süre 30 dakikadır.',
  sleepOptionLabel: (minutes: number) => {
    switch (minutes) {
      case -5:
        return '5 saniye (test)'
      case 10:
        return '10 dakika'
      case 30:
        return '30 dakika (Önerilen)'
      case 60:
        return '1 saat'
      case 120:
        return '2 saat'
      case 180:
        return '3 saat (Performans için önerilmez)'
      default:
        return `${minutes} dakika`
    }
  },
  sectionDanger: 'Tehlikeli bölge',
  dangerDeleteAll: 'Verileri sil',
  dangerConfirmBody:
    'Emin misiniz? Tüm ayarlar, modeller ve sohbet geçmişi kalıcı olarak silinecektir.',
  dangerCancel: 'İptal',
  dangerDelete: 'Sil',
  dangerWarningBody:
    'Uygulama tüm veriler silindikten sonra kapanacaktır. Devam etmek istiyor musunuz?',
  dangerConfirmClose: 'Tamam, kapat',
  gearTitle: 'Ayarlar',
  gearAria: 'Ayarlar'
}

const bundles: Record<SettingsUiLocale, SettingsUiCopy> = { en, tr }

export function getSettingsUiCopy(locale: SettingsUiLocale): SettingsUiCopy {
  return bundles[locale] ?? bundles.en
}

export function sleepSelectOptions(locale: SettingsUiLocale): SleepSelectOption[] {
  const t = getSettingsUiCopy(locale)
  return AUTO_CLOSE_TIMEOUT_VALUES.map((value) => ({
    value,
    label: t.sleepOptionLabel(value)
  }))
}

export function isSettingsUiLocale(value: unknown): value is SettingsUiLocale {
  return value === 'en' || value === 'tr'
}
