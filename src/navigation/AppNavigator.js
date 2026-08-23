import {
  NavigationContainer,
} from '@react-navigation/native';

import RootNavigator from './RootNavigator';

export default function AppNavigator({
  session,
}) {
  return (
    <NavigationContainer>
      <RootNavigator
        session={session}
      />
    </NavigationContainer>
  );
}
