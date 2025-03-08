import { isEmpty } from 'lodash-es';
import {
  ActionIcon,
  Button,
  Center,
  Group,
  Loader,
  Menu,
  Table,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { RiDeleteBinLine, RiEditLine } from 'react-icons/ri';
import { GrRefresh } from 'react-icons/gr';
import {
  CleanStorageLink,
  GetStorageLinks,
  GetStorages,
  RemoveStorageLink,
} from '../../../../wailsjs/go/services/StorageService';
import { v1 } from '../../../../wailsjs/go/models';
import { FormatBytes } from '../../../../wailsjs/go/services/SystemService';
import { GetNodes } from '../../../../wailsjs/go/services/NodeService';
import { GetLocations } from '../../../../wailsjs/go/services/LocationService';
import { FiMoreHorizontal } from 'react-icons/fi';
import { MdOutlineCleaningServices } from 'react-icons/md';
import { CreateStorageLink } from '../CreateStorageLink';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';

export function StorageLink(props: { opened: boolean }) {
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showCreateStorageLink, setShowCreateStorageLink] = useState<boolean>(false);
  const [selectedStorageLink, setSelectedStorageLink] = useState<v1.StorageLink>();
  const [storageLinkList, setStorageLinkList] = useState<
    Array<
      v1.StorageLink & {
        node?: v1.Node;
        storage?: v1.Storage;
        location?: v1.Location;
        format: { limitSize: string; usedSize: string };
      }
    >
  >([]);

  const openCleanModal = (storageLinkId: string) => {
    const modalId = modals.open({
      title: '提示',
      centered: true,
      children: (
        <>
          <Text size="sm">确认清空所有存储块吗?</Text>

          <Group justify="flex-end" mt={10}>
            <Button variant="default" onClick={() => modals.close(modalId)}>
              取消
            </Button>
            <Button
              color="red"
              onClick={async () => {
                modals.updateModal({
                  modalId,
                  title: '提示',
                  centered: true,
                  children: (
                    <>
                      <Text size="sm">确认清空所有存储块吗?</Text>

                      <Group justify="flex-end" mt={10}>
                        <Button variant="default" onClick={() => modals.close(modalId)}>
                          取消
                        </Button>
                        <Button color="red" loading={true} loaderProps={{ type: 'dots' }}>
                          清空
                        </Button>
                      </Group>
                    </>
                  ),
                });

                try {
                  await CleanStorageLink(storageLinkId);
                  fetchData();
                  modals.close(modalId);
                } catch (error: any) {
                  modals.close(modalId);
                  notifications.show({ color: 'red', message: error });
                }
              }}
            >
              清空
            </Button>
          </Group>
        </>
      ),
    });
  };

  const openRemoveModal = (storageLinkId: string) => {
    const modalId = modals.open({
      title: '提示',
      centered: true,
      children: (
        <>
          <Text size="sm">确认删除存储关联吗?</Text>

          <Group justify="flex-end" mt={10}>
            <Button variant="default" onClick={() => modals.close(modalId)}>
              取消
            </Button>
            <Button
              color="red"
              onClick={async () => {
                modals.updateModal({
                  modalId,
                  title: '提示',
                  centered: true,
                  children: (
                    <>
                      <Text size="sm">确认删除存储关联吗?</Text>

                      <Group justify="flex-end" mt={10}>
                        <Button variant="default" onClick={() => modals.close(modalId)}>
                          取消
                        </Button>
                        <Button color="red" loading={true} loaderProps={{ type: 'dots' }}>
                          删除
                        </Button>
                      </Group>
                    </>
                  ),
                });

                try {
                  await RemoveStorageLink(storageLinkId);
                  fetchData();
                  modals.close(modalId);
                } catch (error: any) {
                  modals.close(modalId);
                  notifications.show({ color: 'red', message: error });
                }
              }}
            >
              删除
            </Button>
          </Group>
        </>
      ),
    });
  };

  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);

      const nodeList = await GetNodes();
      const storageList = await GetStorages();
      const locationList = await GetLocations();

      const storageLinkList = await Promise.all(
        (await GetStorageLinks()).map(async (storageLink) => ({
          ...storageLink,
          node: nodeList.find((node) => node.id === storageLink.node_id),
          storage: storageList.find((storage) => storage.id === storageLink.storage_id),
          location: locationList?.find((location) => location.id === storageLink.location_id),
          format: {
            limitSize: await FormatBytes(storageLink.limit_size ?? 0),
            usedSize: await FormatBytes(storageLink.used_size ?? 0),
          },
        })),
      );

      setStorageLinkList(storageLinkList);
      setLoading(false);
    } catch (error: any) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.opened) fetchData();
  }, [props.opened]);

  if (loading) {
    return (
      <Center mt={150}>
        <Loader color="blue" />
      </Center>
    );
  }

  if (error) {
    return (
      <>
        <Center mt={150}>
          <Text color="red">{error}</Text>
        </Center>

        <Center mt={5}>
          <Button variant="default" onClick={fetchData}>
            重试
          </Button>
        </Center>
      </>
    );
  }

  return (
    <>
      <CreateStorageLink
        opened={showCreateStorageLink}
        storageLink={selectedStorageLink}
        onClose={() => setShowCreateStorageLink(false)}
        onCreated={() => {
          setShowCreateStorageLink(false);
          fetchData();
        }}
      />

      <Group justify="end" mt={15} mb={5}>
        <Button
          p={10}
          onClick={() => {
            setSelectedStorageLink(undefined);
            setShowCreateStorageLink(true);
          }}
        >
          新增关联
        </Button>

        <ActionIcon variant="transparent" size={20} onClick={() => fetchData()}>
          <GrRefresh size={15} color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
        </ActionIcon>
      </Group>

      {isEmpty(storageLinkList) ? (
        <Center mt={150}>
          <Text size="lg">未找到存储关联信息</Text>
        </Center>
      ) : (
        <Table striped highlightOnHover withRowBorders={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>存储</Table.Th>
              <Table.Th>节点</Table.Th>
              <Table.Th>存储位置</Table.Th>
              <Table.Th>限制大小</Table.Th>
              <Table.Th>已使用大小</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {storageLinkList.map((storageLink, _) => (
              <Table.Tr key={storageLink.id}>
                <Table.Td>
                  <Tooltip label={`${storageLink.storage?.name}(${storageLink.storage_id})`}>
                    <Text w={150} lineClamp={1} size="sm">
                      {storageLink.storage?.name}
                    </Text>
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  {storageLink.node_id ? (
                    <Tooltip label={`${storageLink.node?.name}(${storageLink.node_id})`}>
                      <Text w={150} lineClamp={1} size="sm">
                        {storageLink.node?.name}
                      </Text>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                </Table.Td>
                <Table.Td>
                  {storageLink.location_id ? (
                    <Tooltip label={`${storageLink.location?.name}(${storageLink.location?.node_id})`}>
                      <Text w={150} lineClamp={1} size="sm">
                        {storageLink.location?.name}
                      </Text>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                </Table.Td>
                <Table.Td>{storageLink.format.limitSize}</Table.Td>
                <Table.Td>{storageLink.format.usedSize}</Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={170}>
                    <Menu.Target>
                      <ActionIcon variant="transparent" size={17}>
                        <FiMoreHorizontal color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<RiEditLine size={14} />}
                        onClick={() => {
                          setSelectedStorageLink(storageLink);
                          setShowCreateStorageLink(true);
                        }}
                      >
                        编辑
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        leftSection={<MdOutlineCleaningServices size={14} />}
                        onClick={() => openCleanModal(storageLink.id!)}
                      >
                        清空所有存储块
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        leftSection={<RiDeleteBinLine size={14} />}
                        onClick={() => openRemoveModal(storageLink.id!)}
                      >
                        删除
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </>
  );
}
