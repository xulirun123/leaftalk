import { defineStore } from 'pinia'

export interface GroupSettings {
  requireApproval: boolean
  onlyAdminCanRename: boolean
}

interface State {
  byGroupId: Record<string, GroupSettings>
}

export const useGroupPermissionsStore = defineStore('groupPermissions', {
  state: (): State => ({
    byGroupId: {}
  }),
  getters: {
    getSettings: (state) => (groupId: string): GroupSettings => {
      return state.byGroupId[groupId] || { requireApproval: false, onlyAdminCanRename: false }
    },
    canEditGroupName: (state) => (groupId: string, userRole: 'owner' | 'creator' | 'admin' | 'member'): boolean => {
      const s = state.byGroupId[groupId]
      if (!s) return true
      if (!s.onlyAdminCanRename) return true
      return userRole !== 'member'
    }
  },
  actions: {
    setSettings(groupId: string, settings: Partial<GroupSettings>) {
      const prev = this.byGroupId[groupId] || { requireApproval: false, onlyAdminCanRename: false }
      this.byGroupId[groupId] = {
        requireApproval: settings.requireApproval ?? prev.requireApproval,
        onlyAdminCanRename: settings.onlyAdminCanRename ?? prev.onlyAdminCanRename
      }
    },
    setOnlyAdminCanRename(groupId: string, value: boolean) {
      this.setSettings(groupId, { onlyAdminCanRename: value })
    },
    setRequireApproval(groupId: string, value: boolean) {
      this.setSettings(groupId, { requireApproval: value })
    }
  }
})

