import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert, Image } from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
  User,
  NativeModuleError,
} from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function App() {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const user = userInfo?.user;

  useEffect(() => {
    configureGoogleSignin();
  }, []);

  const configureGoogleSignin = () => {
    GoogleSignin.configure({
      offlineAccess: false,
      webClientId: process.env.EXPO_PUBLIC_WEBCLIENT_ID,
    });
  };

  const verifyGoogleToken = async (idToken: string | null) => {
    const res = await fetch(`${BACKEND_URL}/auth/verify-google-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (res.ok) {
      const currentUser = await GoogleSignin.getCurrentUser();
      setUserInfo(currentUser);
      setIsSigningIn(false);
    }
  };

  const signIn = async () => {
    try {
      setIsSigningIn(true);
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      verifyGoogleToken(result.idToken);
    } catch (err) {
      setIsSigningIn(false);
      const error = err as NativeModuleError;
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        Alert.alert('Sign In Failed', error.message);
      } else {
        // some other error happened
        Alert.alert('Sign In Failed', error.message);
      }
    }
  };

  const signOut = async () => {
    await GoogleSignin.signOut();
    setUserInfo(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {user ? (
        <View>
          <Text>You're logged in as:</Text>

          <View style={styles.userCard}>
            <Image
              source={{ uri: user.photo! }}
              style={styles.userAvatar}
              resizeMode="cover"
            />
            <View>
              <Text>{user.email}</Text>
              <Text style={styles.userCardName}>{user.name}</Text>
            </View>
          </View>

          <Button title="Sign Out" onPress={signOut} />
        </View>
      ) : (
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Light}
          onPress={signIn}
          disabled={isSigningIn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#ABABAB',
    marginVertical: 8,
    padding: 8,
    gap: 8,
  },
  userCardName: {
    fontSize: 12,
    color: '#ABABAB',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
