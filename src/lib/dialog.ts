import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * Cross-platform replacement for `Alert.alert`. React Native Web's `Alert.alert` does nothing, so on web
 * this uses the browser's `alert` / `confirm`: with several buttons, OK runs the last non-cancel button
 * and Cancel runs the one marked `style: 'cancel'`.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const actions = buttons ?? [];
  const cancel = actions.find((b) => b.style === 'cancel');
  const primary = [...actions].reverse().find((b) => b.style !== 'cancel');

  if (actions.length <= 1) {
    window.alert(text);
    actions[0]?.onPress?.();
    return;
  }
  if (window.confirm(text)) primary?.onPress?.();
  else cancel?.onPress?.();
}
