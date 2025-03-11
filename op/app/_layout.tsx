import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { Stack } from "expo-router";

const Layout = () => {
  return (
    <GestureHandlerRootView style={{flex:1}}>
      <Stack screenOptions={{ headerShown: false , presentation: "fullScreenModal" }} initialRouteName="Welcome" />
    </GestureHandlerRootView>
  );
}

export default Layout;
