/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

export const storageKeys = Object.freeze({
  runtimeSnapshot: "socialFocus_runtime_snapshot",
  lifecycleMeta: "socialFocus_lifecycle_meta",
  cloudSyncMeta: "socialFocus_cloud_sync_meta",
  serverUpdateMeta: "socialFocus_server_update_meta",
  remoteOptionsData: "socialFocus_remote_options_data",
  optionsState: "socialFocus_options_state",
  system: "socialFocus_system_config",
  notSyncingState: "socialFocus_not_syncing_state",
});

export const systemBuckets = Object.freeze({
  sharedState: "socialFocus_shared_state",
  meta: "socialFocus_meta",
  dailyLimitData: "socialFocus_daily_limit_data",
  extensionUiState: "socialFocus_extension_ui_state",
});

export const extensionUiKeys = Object.freeze({
  openingTimerIsActive: "socialFocus_openingTimerIsActiveData",
  openingTimerValue: "socialFocus_openingTimerValueData",
  openingTimerMessage: "socialFocus_openingTimerMessageData",
  passwordLockingIsActive: "socialFocus_passwordLockingIsActiveData",
  passwordLockingPassword: "socialFocus_passwordLockingPasswordData",
  passwordLockingPrompt: "socialFocus_passwordLockingPromptData",
  passwordLockingResetIsActive: "socialFocus_passwordLockingResetIsActiveData",
  passwordLockingResetPeriod: "socialFocus_passwordLockingResetPeriodData",
  passwordLockingResetFinalDate: "socialFocus_passwordLockingResetFinalDateData",
});

export const localStateKeys = Object.freeze({
  extensionIsEnabled: "socialFocus_global_enable",
  extensionLanguage: "socialFocus_extensionLanguageData",
  extensionBlockTime: "socialFocus_extension_blockTime",
  extensionBlockLastedTime: "socialFocus_extension_block_lasted_time",
  extensionBlockDeadline: "socialFocus_extension_block_deadline",
  extensionEnableTime: "socialFocus_extension_enableTime",
  extensionEnableLastedTime: "socialFocus_extension_enable_lasted_time",
  extensionEnableDeadline: "socialFocus_extension_enable_deadline",
  username: "socialFocus_pro_username",
  password: "socialFocus_pro_password",
  isCloudSyncing: "socialFocus_isCloudSyncingData",
  lastSyncingDate: "socialFocus_cloudLastSyncingDateData",
  theme: "socialFocus_extensionThemeData",
  temporaryUsername: "socialFocus_temporary_username",
  temporaryPassword: "socialFocus_temporary_password",
  temporaryUuid: "socialFocus_temporary_uuid",
  verificationChallengeId: "socialFocus_verification_challenge_id",
  verificationExpiresAt: "socialFocus_verification_expires_at",
  showVerification: "socialFocus_is_show_verification_screen",
  emailVerificationType: "socialFocus_email_verification_type",
  isUserPro: "socialFocus_is_user_pro",
});

export const sharedStateKeys = Object.freeze({
  userUniqueIdentifier: "socialFocus_userUniqueIdentifier",
  gradientIndex: "socialFocus_gradient_index",
  gradientCurrentDate: "socialFocus_gradient_current_date",
  myOtherApps: "socialFocus_myOtherAppsData",
  shortcutDisableEnable: "socialFocus_shortcuts_disable_enable",
});

export const metaStateKeys = Object.freeze({
  schemaVersion: "socialFocus_schema_version",
  currentOptionsVersion: "socialFocus_current_version_on_settings_release",
  nextUpdateDate: "socialFocus_next_date_to_update",
  init: "init",
  updateSchedule: "updateSchedule",
  initDate: "socialFocus_extension_init_date",
  initTime: "socialFocus_extension_init_time",
  scheduleHour: "socialFocus_schedule_update_hour",
  scheduleWeekDay: "socialFocus_schedule_update_week_day",
});

export const storageRootKeys = Object.freeze(Object.values(storageKeys));
