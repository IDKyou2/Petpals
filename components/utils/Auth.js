import AsyncStorage from '@react-native-async-storage/async-storage';

export const isAuthenticated = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        return token !== null;
    } catch (error) {
        console.error('Error checking authentication', error);
        return false;
    }
};
