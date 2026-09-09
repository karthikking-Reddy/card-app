import { NavigationContainer } from '@react-navigation/native';

import RootNavigator from './RootNavigator';

export default function AppNavigator({ session, authExiting }) {
  return (
    <NavigationContainer>
      <RootNavigator session={session} authExiting={authExiting} />
    </NavigationContainer>
  );
}
