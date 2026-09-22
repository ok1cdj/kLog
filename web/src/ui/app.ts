// App shell: owns the platform and swaps full-screen views. No framework — a screen
// is just an object that mounts into the root and cleans up after itself.

import { getPlatform } from '../platform/index'
import type { KLogPlatform } from '../platform/index'
import { LogListScreen } from './screens/loglist'
import { NewLogScreen } from './screens/newlog'
import { LoggingScreen } from './screens/logging'
import { QsoListScreen } from './screens/qsolist'
import { QsoEditScreen } from './screens/qsoedit'
import { SettingsScreen } from './screens/settings'

export interface Screen {
  mount(root: HTMLElement): void | Promise<void>
  unmount(): void
}

export class App {
  private readonly platform: KLogPlatform = getPlatform()
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
      }),
    )
  }

  showSettings(): void {
    this.show(new SettingsScreen(this.platform, { back: () => this.showLogList() }))
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
      }),
    )
  }

  showQsoList(logId: string): void {
    this.show(
      new QsoListScreen(this.platform, logId, {
        back: () => this.showLogging(logId),
        editQso: (index) => this.showQsoEdit(logId, index),
      }),
    )
  }

  showQsoEdit(logId: string, index: number): void {
    this.show(
      new QsoEditScreen(this.platform, logId, index, {
        done: () => this.showQsoList(logId),
      }),
    )
  }
}
