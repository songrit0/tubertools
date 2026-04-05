import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import VTuberSelectionScreen from '../screens/VTuberSelectionScreen';
import GameBoardScreen from '../screens/GameBoardScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="VTuberSelection" component={VTuberSelectionScreen} />
      <Stack.Screen name="GameBoard" component={GameBoardScreen} />
    </Stack.Navigator>
  );
}
