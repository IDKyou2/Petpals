import React from 'react';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Your app will use the navigation from index.tsx */}
    </Stack>
  );
}