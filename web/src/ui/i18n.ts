// Tiny i18n layer (spec ch. 2): English + Czech, chosen by navigator.language, no
// in-app switch. `t(key, params)` looks up the current language and interpolates
// {name}-style placeholders. Technical tokens (CALL, RST, QSO, TX…) are not
// translated. Keys are typed; the Czech table must cover every English key.

export type Lang = 'en' | 'cs'

export const lang: Lang =
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('cs') ? 'cs' : 'en'

const en = {
  'common.back': 'Back',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.yes': 'Yes',
  'common.no': 'No',

  'loglist.new': '+ New log',
  'loglist.empty': 'No logs yet — create one.',
  'loglist.export': 'export',
  'loglist.delete': 'delete',
  'loglist.deleteConfirm': 'Delete log "{name}" ({count} QSOs)? Cannot be undone.',

  'newlog.title': 'New log',
  'newlog.name': 'Name',
  'newlog.namePlaceholder': 'SOTA OK/ZC-001',
  'newlog.profile': 'Profile',
  'newlog.profileAktivace': 'Activation',
  'newlog.profileAktivaceSub': 'SOTA/POTA/WWFF',
  'newlog.profileObecny': 'General',
  'newlog.profileVkv': 'VHF contest',
  'newlog.profileSat': 'Satellite',
  'newlog.satellite': 'Satellite',
  'newlog.myCall': 'My callsign',
  'newlog.myGrid': 'My locator',
  'newlog.myGridRequired': 'Required for a VHF contest — 6 characters, e.g. JO70FD',
  'newlog.myRef': 'My reference',
  'newlog.myRefPlaceholder': 'OK/ZC-001 — Activation only',
  'newlog.band': 'Band',
  'newlog.mode': 'Mode',
  'newlog.create': 'Create',

  'qsolist.empty': 'No QSOs yet.',

  'qsoedit.title': 'Edit QSO',
  'qsoedit.call': 'Callsign',
  'qsoedit.band': 'Band',
  'qsoedit.mode': 'Mode',
  'qsoedit.rstSent': 'RST sent',
  'qsoedit.rstRcvd': 'RST received',
  'qsoedit.locator': 'Locator',
  'qsoedit.locatorRequired': 'Required for a VHF contest',
  'qsoedit.name': 'Name',
  'qsoedit.serialRcvd': 'Serial received',
  'qsoedit.ref': 'Reference (worked station)',
  'qsoedit.dateUtc': 'Date UTC (YYYYMMDD)',
  'qsoedit.timeUtc': 'Time UTC (HHMM)',
  'qsoedit.deleteConfirm': 'Delete this QSO?',

  'settings.title': 'Settings',
  'settings.display': 'Display',
  'settings.standard': 'Standard',
  'settings.eink': 'E-ink',
  'settings.storage': 'Storage',
  'settings.storageNative': 'native (APK)',
  'settings.storageOpfs': 'OPFS (browser)',
  'settings.storageMemory': 'in-memory only — will NOT survive close!',
  'settings.persistYes': 'Persistent storage: yes',
  'settings.persistNo': 'Persistent storage: no — enabled after Add to Home Screen and the first QSO (mainly for iPad)',
  'settings.db': 'Callsign database',
  'settings.dbBundled': 'Use bundled databases',
  'settings.dbSet': '{set}: v{v} · {d} · {n} calls',
  'settings.dbSet_vkv': 'VHF contest',
  'settings.dbSet_sat': 'Satellites',
  'settings.dbSet_awards': 'SOTA/POTA/WWFF chasers',
  'settings.dbOwn': 'Own worked stations: {n}',
  'settings.dbExport': 'Export',
  'settings.dbImport': 'Import',
  'settings.dbClearConfirm': 'Delete your own callsign database ({n} calls)? Bundled sets stay. Export a backup first.',
  'settings.dbImported': 'Merged {n} records.',
  'settings.help': 'How to log',
  'settings.aboutName': 'kQSO — ham radio logger',
  'settings.aboutLicense': 'License: GPL-3.0',
  'settings.aboutAuthor': 'Author: OK1CDJ',
  'settings.versionWeb': 'Web bundle: {v}',
  'settings.versionApp': 'App (APK): {v}',

  'logging.recover': 'Recover unfinished QSO {call}?',
  'logging.recoverYes': 'recover',
  'logging.recoverNo': 'discard',
  'logging.navLogs': '‹ Logs',

  'install.text': 'For offline use and data safety: Share → Add to Home Screen.',
} as const

const cs: Record<keyof typeof en, string> = {
  'common.back': 'Zpět',
  'common.cancel': 'Zrušit',
  'common.save': 'Uložit',
  'common.delete': 'Smazat',
  'common.yes': 'Ano',
  'common.no': 'Ne',

  'loglist.new': '+ Nový log',
  'loglist.empty': 'Zatím žádný log — založ nový.',
  'loglist.export': 'export',
  'loglist.delete': 'smazat',
  'loglist.deleteConfirm': 'Smazat log „{name}" ({count} QSO)? Nelze vrátit.',

  'newlog.title': 'Nový log',
  'newlog.name': 'Název',
  'newlog.namePlaceholder': 'SOTA OK/ZC-001',
  'newlog.profile': 'Profil',
  'newlog.profileAktivace': 'Aktivace',
  'newlog.profileAktivaceSub': 'SOTA/POTA/WWFF',
  'newlog.profileObecny': 'Obecný',
  'newlog.profileVkv': 'VKV závod',
  'newlog.profileSat': 'Satelit',
  'newlog.satellite': 'Družice',
  'newlog.myCall': 'Moje volačka',
  'newlog.myGrid': 'Můj locator',
  'newlog.myGridRequired': 'Pro VKV závod povinný — 6 znaků, např. JO70FD',
  'newlog.myRef': 'Moje reference',
  'newlog.myRefPlaceholder': 'OK/ZC-001 — jen Aktivace',
  'newlog.band': 'Pásmo',
  'newlog.mode': 'Mód',
  'newlog.create': 'Založit',

  'qsolist.empty': 'Zatím žádné QSO.',

  'qsoedit.title': 'Úprava QSO',
  'qsoedit.call': 'Volačka',
  'qsoedit.band': 'Pásmo',
  'qsoedit.mode': 'Mód',
  'qsoedit.rstSent': 'RST vyslaný',
  'qsoedit.rstRcvd': 'RST přijatý',
  'qsoedit.locator': 'Locator',
  'qsoedit.locatorRequired': 'Pro VKV závod povinný',
  'qsoedit.name': 'Jméno',
  'qsoedit.serialRcvd': 'Pořadové číslo přijaté',
  'qsoedit.ref': 'Reference (protistanice)',
  'qsoedit.dateUtc': 'Datum UTC (RRRRMMDD)',
  'qsoedit.timeUtc': 'Čas UTC (HHMM)',
  'qsoedit.deleteConfirm': 'Smazat toto QSO?',

  'settings.title': 'Nastavení',
  'settings.display': 'Zobrazení',
  'settings.standard': 'Standardní',
  'settings.eink': 'E-ink',
  'settings.storage': 'Úložiště',
  'settings.storageNative': 'nativní (APK)',
  'settings.storageOpfs': 'OPFS (prohlížeč)',
  'settings.storageMemory': 'jen v paměti — NEPŘEŽIJE zavření!',
  'settings.persistYes': 'Trvalé úložiště: ano',
  'settings.persistNo': 'Trvalé úložiště: ne — zapne se po přidání na plochu a prvním QSO (hlavně kvůli iPadu)',
  'settings.db': 'Databáze značek',
  'settings.dbBundled': 'Používat přibalené databáze',
  'settings.dbSet': '{set}: v{v} · {d} · {n} značek',
  'settings.dbSet_vkv': 'VKV závod',
  'settings.dbSet_sat': 'Satelity',
  'settings.dbSet_awards': 'SOTA/POTA/WWFF chaseři',
  'settings.dbOwn': 'Vlastní pracované stanice: {n}',
  'settings.dbExport': 'Export',
  'settings.dbImport': 'Import',
  'settings.dbClearConfirm': 'Smazat vlastní databázi značek ({n} značek)? Přibalené sady zůstanou. Nejdřív si udělej export.',
  'settings.dbImported': 'Sloučeno {n} záznamů.',
  'settings.help': 'Jak zadávat spojení',
  'settings.aboutName': 'kQSO — ham radio deník',
  'settings.aboutLicense': 'Licence: GPL-3.0',
  'settings.aboutAuthor': 'Autor: OK1CDJ',
  'settings.versionWeb': 'Webový bundle: {v}',
  'settings.versionApp': 'Appka (APK): {v}',

  'logging.recover': 'Obnovit rozepsané QSO {call}?',
  'logging.recoverYes': 'obnovit',
  'logging.recoverNo': 'zahodit',
  'logging.navLogs': '‹ Logy',

  'install.text': 'Pro offline provoz a jistotu dat: Sdílet → Přidat na plochu.',
}

const DICT: Record<Lang, Record<string, string>> = { en, cs }

export function t(key: keyof typeof en, params?: Record<string, string | number>): string {
  let s = DICT[lang][key] ?? en[key]
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v))
  return s
}
