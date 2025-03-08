import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { Router } from './Router';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme={'auto'}>
      <ModalsProvider />
      <Notifications position="top-right" autoClose={3000} />
      <Router />
    </MantineProvider>
  );
}
