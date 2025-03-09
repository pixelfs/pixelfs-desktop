import { Center, Group, Loader, Paper, Text } from '@mantine/core';
import { GoogleButton } from '../components/GoogleButton';
import { GithubButton } from '../components/GithubButton';
import { Login } from '../../wailsjs/go/services/AuthService';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);

  const login = async () => {
    try {
      setLoading(true);
      await Login();
      setLoading(false);
      navigate('/');
    } catch (error: any) {
      setLoading(false);
      notifications.show({ color: 'red', message: error });
    }
  };

  return (
    <Center pt={300}>
      {loading ? (
        <Group pt={30}>
          <Loader size={25} />
          <Text>等待登录中...</Text>
        </Group>
      ) : (
        <Paper radius="md" p="xl" withBorder>
          <Text size="lg" fw={500}>
            Welcome to PixelFS, login with
          </Text>

          <Group grow mb="md" mt="md">
            <GoogleButton radius="xl" onClick={login}>
              Google
            </GoogleButton>
            <GithubButton radius="xl" onClick={login}>
              Github
            </GithubButton>
          </Group>
        </Paper>
      )}
    </Center>
  );
}
