import {AuthProvider} from './src/context/AuthContext';
import Main from "./Main";
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import NotificationProvider from "./NotificationProvider";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});


export default function App() {
    return (
        <>
            <AuthProvider>
                <Main/>
            </AuthProvider>
            <NotificationProvider/>
            <Toast/>
        </>
    );
}
