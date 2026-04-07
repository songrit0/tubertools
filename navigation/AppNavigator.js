import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import SelectGameScreen from '../screens/SelectGameScreen';
import HomeScreen from '../screens/HomeScreen';
import VTuberSelectionScreen from '../screens/VTuberSelectionScreen';
import SelectVTuberScreen from '../screens/SelectVTuberScreen';
import ResultSelectionScreen from '../screens/ResultSelectionScreen';
import GameBoardScreen from '../screens/GameBoardScreen';
import AdminDataScreen from '../screens/AdminDataScreen';
import SelectionLogScreen from '../screens/SelectionLogScreen';
import MonopolyLobbyScreen from '../screens/monopoly/MonopolyLobbyScreen';
import MonopolyGameScreen from '../screens/monopoly/MonopolyGameScreen';
import MonopolyResultScreen from '../screens/monopoly/MonopolyResultScreen';

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
      <Stack.Screen name="SelectGame" component={SelectGameScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="VTuberSelection" component={VTuberSelectionScreen} />
      <Stack.Screen name="SelectVTuber" component={SelectVTuberScreen} />
      <Stack.Screen name="ResultSelection" component={ResultSelectionScreen} />
      <Stack.Screen name="GameBoard" component={GameBoardScreen} />
      <Stack.Screen name="AdminData" component={AdminDataScreen} />
      <Stack.Screen name="SelectionLog" component={SelectionLogScreen} />
      <Stack.Screen name="MonopolyLobby" component={MonopolyLobbyScreen} />
      <Stack.Screen name="MonopolyGame" component={MonopolyGameScreen} />
      <Stack.Screen name="MonopolyResult" component={MonopolyResultScreen} />
    </Stack.Navigator>
  );
}
