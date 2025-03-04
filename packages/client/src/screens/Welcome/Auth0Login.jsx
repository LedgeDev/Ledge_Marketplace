import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  Dimensions,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useDispatch } from 'react-redux';
import { useAuthService } from '../../services/authService';
import { getOrCreateUser } from '../../store/models/users';

function Auth0Login() {
  const { t } = useTranslation();
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const { handleLogin, setAuthServiceEmail, setAuthServicePassword, initializeAuth } =
    useAuthService();
  const dispatch = useDispatch();
  const [localEmail, setLocalEmail] = useState('');
  const [localPassword, setLocalPassword] = useState('');

  useEffect(() => {
    initializeAuth();
  }, []);

  const handleEmailChange = (email) => {
    setLocalEmail(email);
    setAuthServiceEmail(email);
  };

  const handlePasswordChange = (password) => {
    setLocalPassword(password);
    setAuthServicePassword(password);
  };

  const handleLoginPress = async () => {
    const [email, name] = await handleLogin();
    if (!email) {
      return;
    }
    // Dispatch the getOrCreateUser action with the local email
    try {
      dispatch(getOrCreateUser({ email: email, name: name }));
    } catch (error) {
      console.error('Error creating user', error);
    }
  };

  return (
    <View
      className="flex justify-center gap-2 px-10 items-center"
      style={{ width: windowWidth, height: windowHeight }}
    >
      <Image
        // className="object-contain w-40 h-40"
        source={require('../../assets/logos/logo_blue.png')}
        style={{ objectFit: 'contain', width: 200, height: 160 }}
      />
      <TextInput
        maxLength={50}
        placeholder="Email"
        onChangeText={handleEmailChange}
        className="w-full bg-white p-6 rounded-lg"
        autoCapitalize="none"
        value={localEmail}
      />
      <TextInput
        maxLength={50}
        placeholder="Password"
        onChangeText={handlePasswordChange}
        secureTextEntry
        className="w-full bg-white p-6 rounded-lg"
        autoCapitalize="none"
        value={localPassword}
      />
      <TouchableOpacity
        onPress={handleLoginPress}
        className="w-full flex items-center justify-center h-12 bg-pink rounded-2xl"
      >
        <Text className="text-blue text-xl font-bold">
          {t('welcome.logIn')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default Auth0Login;
