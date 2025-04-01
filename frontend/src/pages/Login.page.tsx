import { Center, Group, Loader, Paper, Text } from '@mantine/core';
import { GoogleButton } from '../components/GoogleButton';
import { GithubButton } from '../components/GithubButton';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../bindings/github.com/pixelfs/pixelfs-desktop/services';

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);

  const login = async () => {
    try {
      setLoading(true);
      await AuthService.Login();
      setLoading(false);
      navigate('/');
    } catch (error: any) {
      setLoading(false);
      notifications.show({ color: 'red', message: error.message });
    }
  };

  return (
    <Center pt={260}>
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
