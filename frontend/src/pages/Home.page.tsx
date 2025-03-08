import { useEffect, useState } from 'react';
import {
  ActionIcon,
  AppShell,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  Loader,
  NativeSelect,
  Text,
  Tooltip,
} from '@mantine/core';
import { FiPlus } from 'react-icons/fi';
import { CiSettings } from 'react-icons/ci';
import { useNavigate } from 'react-router-dom';
import { isEmpty } from 'lodash-es';
import { v1 } from '../../wailsjs/go/models';
import { GetUserInfo } from '../../wailsjs/go/services/UserService';
import { GetLocalStorage, SetLocalStorage } from '../../wailsjs/go/services/LocalStorageService';
import { LocationList } from '../components/LocationList';
import { FileManager } from '../components/FileManager';
import { Settings, TransportModal } from '../components/Modal';
import { GetUserToken, Logout } from '../../wailsjs/go/services/AuthService';
import { StartWebsocketClient } from '../../wailsjs/go/services/SystemService';
import { CreateLocation } from '../components/Modal/CreateLocation';
import { notifications } from '@mantine/notifications';

export function HomePage() {
  const navigate = useNavigate();
  const [path, setPath] = useState<string>('');
  const [nodeId, setNodeId] = useState<string>('');
  const [location, setLocation] = useState<v1.Location | null>(null);
  const [userInfo, setUserInfo] = useState<v1.GetUserInfoResponse>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [refreshLocationKey, setRefreshLocationKey] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCreateLocation, setShowCreateLocation] = useState<boolean>(false);
  const [showTransportModal, setShowTransportModal] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      setUserInfo(undefined);

      const userInfo = await GetUserInfo();

      // Get selected node id from storage
      const selectedNodeId = await GetLocalStorage('selectedNodeId');
      const nodeId = !isEmpty(selectedNodeId) ? selectedNodeId : userInfo.nodes?.[0].id!;

      await SetLocalStorage('selectedNodeId', nodeId);
      setNodeId(nodeId);
      setUserInfo(userInfo);
      setLoading(false);
    } catch (error: any) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isEmpty(await GetUserToken())) {
        navigate('/login');
        return;
      }

      await StartWebsocketClient();
      await fetchData();
    };

    init();
  }, []);

  if (loading) {
    return (
      <Center py={300}>
        <Loader color="blue" />
      </Center>
    );
  }

  if (error) {
    return (
      <>
        <Center pt={300}>
          <Text color="red">{error}</Text>
        </Center>

        <Center pt={10}>
          <Button variant="default" onClick={fetchData}>
            重试
          </Button>
        </Center>
      </>
    );
  }

  return (
    <>
      <Settings opened={showSettings} onClose={() => setShowSettings(false)} />

      <CreateLocation
        nodeId={nodeId}
        nodeList={userInfo?.nodes ?? []}
        location={{}}
        isEdit={false}
        opened={showCreateLocation}
        onClose={() => setShowCreateLocation(false)}
        onCreated={() => {
          setRefreshLocationKey((prev) => prev + 1);
          setShowCreateLocation(false);
        }}
      />

      <TransportModal opened={showTransportModal} onClose={() => setShowTransportModal(false)} />

      <AppShell navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: true } }} padding="md">
        <AppShell.Navbar p="md">
          <Flex direction="column" justify="space-between" h="100%">
            <Box pt={20}>
              <Group justify="space-between">
                <Box>
                  <Text>{userInfo?.name}</Text>
                  <Text size="xs" c="dimmed">
                    {userInfo?.email}
                  </Text>
                </Box>

                <Tooltip label="设置" withArrow position="right">
                  <ActionIcon variant="default" size={20} onClick={() => setShowSettings(true)}>
                    <CiSettings size={15} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Divider my="xs" />
              <NativeSelect
                mb="xs"
                value={nodeId}
                onChange={(event) => {
                  setNodeId(event.currentTarget.value);
                  SetLocalStorage('selectedNodeId', event.currentTarget.value);
                }}
                data={userInfo?.nodes?.map((node) => ({ label: `${node.name ?? ''}(${node.id})`, value: node.id! }))}
              />

              <Group justify="space-between">
                <Text size="xs" fw={500} c="dimmed">
                  存储位置
                </Text>
                <Tooltip label="创建存储位置" withArrow position="right">
                  <ActionIcon variant="default" size={18} onClick={() => setShowCreateLocation(true)}>
                    <FiPlus size={12} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <LocationList
                nodeId={nodeId}
                nodeList={userInfo?.nodes ?? []}
                key={refreshLocationKey}
                selectedId={location?.id ?? ''}
                onChangeLocation={(location) => {
                  setPath('');
                  setLocation(location);
                }}
              />
            </Box>

            <Box>
              <Button variant="default" mt={10} w={265} onClick={() => setShowTransportModal(true)}>
                传输管理
              </Button>

              <Button
                variant="default"
                mt={10}
                w={265}
                onClick={async () => {
                  try {
                    await Logout();
                    navigate('/login');
                  } catch (error: any) {
                    if (error != 'cancel') notifications.show({ color: 'red', message: error });
                  }
                }}
              >
                退出
              </Button>
            </Box>
          </Flex>
        </AppShell.Navbar>
        <AppShell.Main>
          {!isEmpty(nodeId) && !isEmpty(location) ? (
            <FileManager location={location} path={path} onChangePath={(path) => setPath(path)} />
          ) : (
            <>
              <Center pt={300}>
                <Text size="md" fw={400} color="red">
                  该节点未发现任何存储位置，请点击下方按钮创建存储位置
                </Text>
              </Center>

              <Center mt={10}>
                <Button onClick={() => setShowCreateLocation(true)}>创建存储位置</Button>
              </Center>
            </>
          )}
        </AppShell.Main>
      </AppShell>
    </>
  );
}
