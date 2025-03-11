import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  Easing,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { useState } from 'react';
import Marquee from '~/components/Marquee';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Event {
  id: number;
  image: any;
}

export const events: Event[] = [
  {
    id: 1,
    image: require('../assets/1.jpg'),
  },
  {
    id: 2,
    image: require('../assets/2.jpg'),
  },
  {
    id: 3,
    image: require('../assets/3.jpg'),
  },
  {
    id: 4,
    image: require('../assets/4.jpg'),
  },
];

const Welcome = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  return (
    <View className="relative flex-1 items-center ">
      <Animated.View className="absolute left-0 top-0 h-full w-full">
        <Animated.Image
          key={events[activeIndex].id}
          entering={FadeIn.duration(1000)}
          exiting={FadeOut.duration(1000)}
          source={events[activeIndex].image}
          className="h-full w-full"
          resizeMode="cover"
        />
      </Animated.View>

      <BlurView intensity={80} style={{ flex: 1, width: '100%', height: '100%' }}>
          <Animated.View
            className="h-[50vh] w-full"
            entering={SlideInUp.duration(1000)
              .easing(Easing.out(Easing.quad))
              .springify()
              .mass(2)
              .stiffness(20)}
            exiting={FadeOut}
            style={{ marginTop: 60 }}>
            <Marquee events={events} onIndexChange={setActiveIndex} />
          </Animated.View>

          <View className="flex-1 justify-center h-[40vh] mb-[50px]   gap-4 p-4">
            <Animated.Text
              className="text-center text-2xl font-bold text-white/60"
              entering={FadeInUp.duration(600).delay(400).springify().mass(2).stiffness(20)}>
              Welcome to
            </Animated.Text>
            <View className="flex-row justify-center">
              {Array.from('Apple Invites').map((letter, index) => (
                <Animated.Text
                  key={index}
                  className="text-5xl font-bold text-white"
                  entering={FadeInDown.duration(600).delay(600 + index * 80)}>
                  {letter}
                </Animated.Text>
              ))}
            </View>
            <Animated.Text
              className="mb-5 text-center text-lg text-white/60"
              entering={FadeInUp.duration(600).delay(400).springify().mass(2).stiffness(20)}>
              Create beautiful invitations for your events. Anyone can receive invitations.
            </Animated.Text>

            <AnimatedPressable
              onPress={() => router.push('/page')}
              entering={FadeInUp.duration(600).delay(400).springify().mass(2).stiffness(20)}
              className="items-center self-center rounded-full bg-white px-10 py-4">
              <Text className="text-lg font-bold ">Create an Event</Text>
            </AnimatedPressable>
          </View>
      </BlurView>
    </View>
  );
};

export default Welcome;
