import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import AuthScreen from '../screens/AuthScreen';
import TabNavigator from './TabNavigator';

const Stack =
  createNativeStackNavigator();

export default function RootNavigator({
  session,
}) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!session ? (
        <Stack.Screen
          name="Auth"
          component={
            AuthScreen
          }
        />
      ) : (
        <Stack.Screen
          name="Main"
          component={
            TabNavigator
          }
        />
      )}
    </Stack.Navigator>
  );
}
