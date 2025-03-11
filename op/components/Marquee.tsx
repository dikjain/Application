import { View, Image, useWindowDimensions } from 'react-native';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useFrameCallback,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface Event {
  id: number;
  image: any;
}

interface MarqueeItemProps extends PropsWithChildren {
  index: number;
  scroll: Animated.SharedValue<number>;
  containerWidth: number;
  itemWidth: number;
  onIndexChange?: (index: number) => void; // Added onIndexChange as optional
}

const MarqueeItem = ({
  index,
  scroll,
  containerWidth,
  itemWidth,
  children,
  onIndexChange
}: MarqueeItemProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const shift = (containerWidth - screenWidth) / 2;
  const initialPosition = itemWidth * index - shift;

  const animatedStyle = useAnimatedStyle(() => {
    // Ensure wrapping in both directions
    let position = (initialPosition - scroll.value) % containerWidth;
    if (position < -itemWidth) position += containerWidth;
    if (position > containerWidth - itemWidth) position -= containerWidth;

    const rotation = interpolate(position, [0, screenWidth - itemWidth], [-1, 1]);
    const translateY = interpolate(
      position,
      [0, (screenWidth - itemWidth) / 2, screenWidth - itemWidth],
      [3, 0, 3]
    );

    return {
      left: position,
      transform: [{ rotateZ: `${rotation}deg` }, { translateY }],
    };
  });

  return (
    <Animated.View
      className="absolute h-full p-2 shadow-md"
      style={[{ width: itemWidth, transformOrigin: 'bottom' }, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const Marquee = ({ events, onIndexChange }: { events: Event[]; onIndexChange?: (index: number) => void }) => {
  const scroll = useSharedValue(0);
  const scrollSpeed = useSharedValue(50); // pixels per second
  const { width: screenWidth } = useWindowDimensions();
  const itemWidth = screenWidth * 0.85;
  const [activeIndex, setActiveIndex] = useState(0);

  const containerWidth = events.length * itemWidth;

  useFrameCallback((frameInfo) => {
    const deltaSeconds = (frameInfo.timeSincePreviousFrame ?? 0) / 1000;
    scroll.value += scrollSpeed.value * deltaSeconds;

    // Keep scroll value within bounds for infinite looping
    if (scroll.value > containerWidth) {
      scroll.value -= containerWidth;
    } else if (scroll.value < 0) {
      scroll.value += containerWidth;
    }
  });

  useEffect(() => {
    if (onIndexChange) {
      const state = (activeIndex + 1) % events.length; // Updated to use events.length
  
      // Avoid unnecessary re-renders
      if (state !== activeIndex) {
        onIndexChange(state);
      }
    }
  }, [activeIndex, onIndexChange]); 
  

  useAnimatedReaction(
    () => scroll.value,
    (value) => {
      const normalisedScroll = (value + screenWidth / 2) % containerWidth;
      const newActiveIndex = Math.floor(normalisedScroll / itemWidth); // Updated variable name

      runOnJS(setActiveIndex)(newActiveIndex);
    }
  );


  const gesture = Gesture.Pan()
    .onChange((event) => {
      scroll.value -= event.changeX;
      scrollSpeed.value = 0;
    })
    .onFinalize((event) => {
      scrollSpeed.value = -event.velocityX;
      scrollSpeed.value = withTiming(
        50 * Math.sign(scrollSpeed.value),
        { duration: 1000, easing: Easing.out(Easing.quad) }
      );
    });

  useEffect(() => {
    // Reset scroll when events change
    scroll.value = 0;
  }, [events]);

  return (
    <GestureDetector gesture={gesture}>
      <View className="h-full flex-row overflow-hidden">
        {events.map((event, index) => (
          <MarqueeItem
            key={event.id}
            index={index}
            scroll={scroll}
            itemWidth={itemWidth}
            containerWidth={containerWidth}
            onIndexChange={onIndexChange} // Pass onIndexChange to MarqueeItem
          >
            <Image source={event.image} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
          </MarqueeItem>
        ))}
      </View>
    </GestureDetector>
  );
};

export default Marquee;
