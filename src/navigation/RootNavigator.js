import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthScreen from '../screens/AuthScreen';
import TabNavigator from './TabNavigator';

import CardScreen from '../screens/Card/CardScreen';
import SocialLinksScreen from '../screens/SocialLinks/SocialLinksScreen';
import ServicesScreen from '../screens/Services/ServicesScreen';
import PortfolioScreen from '../screens/Portfolio/PortfolioScreen';
import LeadDetailScreen from '../screens/Connections/LeadDetailScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator({ session }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!session ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
          />

          <Stack.Screen
            name="CardEditor"
            component={CardScreen}
          />

          <Stack.Screen
            name="SocialLinks"
            component={SocialLinksScreen}
          />

          <Stack.Screen
            name="Services"
            component={ServicesScreen}
          />

          <Stack.Screen
            name="Portfolio"
            component={PortfolioScreen}
          />

          <Stack.Screen
            name="LeadDetail"
            component={LeadDetailScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
