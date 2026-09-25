// App shell: owns the platform and swaps full-screen views. No framework — a screen
// is just an object that mounts into the root and cleans up after itself.

import { getPlatform } from '../platform/index'
import type { KQSOPlatform } from '../platform/index'
import { LogListScreen } from './screens/loglist'
import { NewLogScreen } from './screens/newlog'
import { LoggingScreen } from './screens/logging'
import { QsoListScreen } from './screens/qsolist'
import { QsoEditScreen } from './screens/qsoedit'
import { SettingsScreen } from './screens/settings'
import { HelpScreen } from './screens/help'
import { EdiExportScreen } from './screens/ediexport'

export interface Screen {
  mount(root: HTMLElement): void | Promise<void>
  unmount(): void
}

export class App {
  private readonly platform: KQSOPlatform = getPlatform()
  private root!: HTMLElement
  private current: Screen | null = null

  mount(root: HTMLElement): void {
    this.root = root
    this.showLogList()
  }

  private show(screen: Screen): void {
    this.current?.unmount()
    this.current = screen
    void screen.mount(this.root)
  }

  showLogList(): void {
    this.show(
      new LogListScreen(this.platform, {
        openLog: (id) => this.showLogging(id),
        newLog: () => this.showNewLog(),
        openSettings: () => this.showSettings(),
        exportEdi: (id) => this.showEdiExport(id),
      }),
    )
  }

  showSettings(): void {
    this.show(
      new SettingsScreen(this.platform, {
        back: () => this.showLogList(),
        openHelp: () => this.showHelp(() => this.showSettings()),
      }),
    )
  }

  showNewLog(): void {
    this.show(
      new NewLogScreen(this.platform, {
        created: (id) => this.showLogging(id),
        cancel: () => this.showLogList(),
      }),
    )
  }

  showLogging(logId: string): void {
    this.show(
      new LoggingScreen(this.platform, logId, {
        toLogList: () => this.showLogList(),
        toQsoList: () => this.showQsoList(logId),
        editQso: (index) => this.showQsoEdit(logId, index, () => this.showLogging(logId)),
        toHelp: () => this.showHelp(() => this.showLogging(logId)),
      }),
    )
  }

  showEdiExport(logId: string): void {
    this.show(new EdiExportScreen(this.platform, logId, { back: () => this.showLogList() }))
  }

  showHelp(back: () => void): void {
    this.show(new HelpScreen({ back }))
  }

  showQsoList(logId: string): void {
    this.show(
      new QsoListScreen(this.platform, logId, {
        back: () => this.showLogging(logId),
        editQso: (index) => this.showQsoEdit(logId, index, () => this.showQsoList(logId)),
      }),
    )
  }

  /** `back` returns to wherever the edit was opened from (QSO list or logging). */
  showQsoEdit(logId: string, index: number, back: () => void): void {
    this.show(
      new QsoEditScreen(this.platform, logId, index, {
        done: back,
      }),
    )
  }
}
