import * as Haptics from 'expo-haptics';

export const haptics = {
    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    buttonTap: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    selectionChanged: () => {
        Haptics.selectionAsync();
    },
    messageSent: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    messageReceived: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
};
