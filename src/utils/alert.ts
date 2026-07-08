export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export interface AlertRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type AlertListener = (request: AlertRequest | null) => void;

let listener: AlertListener | null = null;

export const registerAlertListener = (handler: AlertListener): (() => void) => {
  listener = handler;
  return () => {
    if (listener === handler) {
      listener = null;
    }
  };
};

export const hideAlert = (): void => {
  listener?.(null);
};

export const showAlert = (
  title: string,
  message?: string,
  buttons: AlertButton[] = [{ text: 'OK', style: 'default' }],
): void => {
  listener?.({ title, message, buttons });
};
