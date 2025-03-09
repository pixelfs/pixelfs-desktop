import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Menu,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { v1 } from '../../wailsjs/go/models';
import { GetLocations, RemoveLocation } from '../../wailsjs/go/services/LocationService';
import { FiMoreHorizontal } from 'react-icons/fi';
import { RiDeleteBinLine, RiEditLine } from 'react-icons/ri';
import { isEmpty } from 'lodash-es';
import { notifications } from '@mantine/notifications';
import { CreateLocation } from './Modal/CreateLocation';
import { modals } from '@mantine/modals';

export function LocationList(props: {
  nodeId: string;
  selectedId: string;
  nodeList: v1.Node[];
  onChangeLocation: (location: v1.Location | null) => void;
}) {
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [locations, setLocations] = useState<Array<v1.Location>>([]);
  const [editLocation, setEditLocation] = useState<v1.Location>({});
  const [showEditLocation, setShowEditLocation] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);
      const locations = (await GetLocations())?.filter((location) => location.node_id === props.nodeId) ?? [];

      const selectedLocation = locations.find((location) => location.id === props.selectedId);
      props.onChangeLocation(isEmpty(selectedLocation) ? locations[0] : selectedLocation);

      setLocations(locations);
      setLoading(false);
    } catch (error: any) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [props.nodeId]);

  useEffect(() => setSelectedId(props.selectedId), [props.selectedId]);

  if (loading) {
    return (
      <Center pt={200}>
        <Loader color="blue" />
      </Center>
    );
  }

  if (error) {
    return (
      <>
        <Center pt={200}>
          <Text color="red" size="sm">
            {error}
          </Text>
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
    <Box pt={5}>
      <CreateLocation
        nodeId={props.nodeId}
        nodeList={props.nodeList}
        location={editLocation}
        isEdit={true}
        opened={showEditLocation}
        onClose={() => setShowEditLocation(false)}
        onCreated={() => {
          setShowEditLocation(false);
          fetchData();
        }}
      />

      {locations.map((location, index) => (
        <Group
          key={index}
          justify="space-between"
          h={35}
          my={5}
          px={15}
          style={{ borderRadius: '5px' }}
          bg={selectedId === location.id ? (colorScheme === 'light' ? '#f1f1f1' : '#2d2d2d') : 'transparent'}
        >
          <UnstyledButton
            w={200}
            onClick={() => {
              setSelectedId(location.id!);
              props.onChangeLocation(location);
            }}
          >
            {location.name}
          </UnstyledButton>

          <Menu shadow="md" width={100}>
            <Menu.Target>
              <ActionIcon variant="transparent" size={17}>
                <FiMoreHorizontal color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<RiEditLine size={14} />}
                onClick={() => {
                  setEditLocation(location);
                  setShowEditLocation(true);
                }}
              >
                编辑
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<RiDeleteBinLine size={14} />}
                onClick={() =>
                  modals.openConfirmModal({
                    title: '提示',
                    centered: true,
                    children: <Text size="sm">确认要删除存储位置吗?</Text>,
                    labels: { confirm: '删除', cancel: '取消' },
                    confirmProps: { color: 'red' },
                    onConfirm: async () => {
                      try {
                        await RemoveLocation(location.id!);
                        await fetchData();
                      } catch (error: any) {
                        notifications.show({ color: 'red', message: error });
                      }
                    },
                  })
                }
              >
                删除
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      ))}
    </Box>
  );
}
