export function navigateToMainTab(navigation, tabName = 'Home') {
  navigation.navigate('MainTabs', { screen: tabName });
}

export function resetToMainTab(navigation, tabName = 'Home') {
  navigation.reset({
    index: 0,
    routes: [{ name: 'MainTabs', params: { screen: tabName } }],
  });
}

export function safeGoBack(navigation, options = {}) {
  if (!navigation) return;

  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  if (options.fallbackRoute) {
    navigation.navigate(options.fallbackRoute, options.fallbackParams);
    return;
  }

  navigateToMainTab(navigation, options.fallbackTab || 'Home');
}
