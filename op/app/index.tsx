import { Stack, Link, Redirect, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Button } from '~/components/Button';
import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';
import Welcome from './Welcome';
import 'react-native-reanimated';

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.replace('/Welcome')
    }, 1000)
  }, [])

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        <ScreenContent path="app/index.tsx" title="Home">
        
        </ScreenContent>
        <Link href={{ pathname: '/details', params: { name: 'Dan' } }} asChild>
          <Button className="bg-green-500" title="Show Details" />
        </Link>
      </Container>
    </>
  );
}

export default Home;
