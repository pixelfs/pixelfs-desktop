import { isEmpty } from 'lodash-es';
import {
  ActionIcon,
  Button,
  Center,
  Code,
  Group,
  Loader,
  Table,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { RiDeleteBinLine } from 'react-icons/ri';
import { GrRefresh } from 'react-icons/gr';
import { notifications } from '@mantine/notifications';
import { CreateStorage } from '../CreateStorage';
import { StorageInfo } from './StorageInfo';
import { modals } from '@mantine/modals';
import { StorageService } from '../../../../bindings/github.com/pixelfs/pixelfs-desktop/services';
import * as v1 from '../../../../bindings/github.com/pixelfs/pixelfs/gen/pixelfs/v1';

export function Storage(props: { opened: boolean }) {
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showCreateStorage, setShowCreateStorage] = useState<boolean>(false);
  const [showStorageInfo, setShowStorageInfo] = useState<boolean>(false);
  const [storageList, setStorageList] = useState<Array<v1.Storage>>([]);
  const [selectedStorage, setSelectedStorage] = useState<v1.Storage>();

  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);

      setStorageList((await StorageService.GetStorages()).filter((s) => !!s));
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
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
          <Text color="red" size="sm">
            {error}
          </Text>
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
      <CreateStorage
        opened={showCreateStorage}
        onClose={() => setShowCreateStorage(false)}
        onCreated={() => {
          setShowCreateStorage(false);
          fetchData();
        }}
      />

      <StorageInfo opened={showStorageInfo} storage={selectedStorage} onClose={() => setShowStorageInfo(false)} />

      <Group justify="end" mt={15}>
        <Button p={10} onClick={() => setShowCreateStorage(true)}>
          新增存储
        </Button>

        <ActionIcon variant="transparent" size={20} onClick={() => fetchData()}>
          <GrRefresh size={15} color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
        </ActionIcon>
      </Group>

      {isEmpty(storageList) ? (
        <Center mt={150}>
          <Text>未找到存储信息</Text>
        </Center>
      ) : (
        <Table striped highlightOnHover withRowBorders={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>名称</Table.Th>
              <Table.Th>网络</Table.Th>
              <Table.Th>配置</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {storageList.map((storage, _) => (
              <Table.Tr
                key={storage.id}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedStorage(storage!);
                  setShowStorageInfo(true);
                }}
              >
                <Table.Td>{storage.id}</Table.Td>
                <Table.Td>
                  <Tooltip label={storage.name}>
                    <Text w={100} lineClamp={1} size="sm">
                      {storage.name}
                    </Text>
                  </Tooltip>
                </Table.Td>
                <Table.Td>{storage.network === 1 ? '私网' : '公网'}</Table.Td>
                <Table.Td>
                  <Tooltip label={JSON.stringify(storage.Config['S3'])}>
                    <Text w={260} lineClamp={1} size="sm">
                      {JSON.stringify(storage.Config['S3'])}
                    </Text>
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant="transparent"
                    size={17}
                    onClick={(event) => {
                      event.stopPropagation();
                      modals.openConfirmModal({
                        title: '提示',
                        centered: true,
                        children: <Text size="sm">确认要删除 {`<${storage.name}>`} 存储吗?</Text>,
                        labels: { confirm: '删除', cancel: '取消' },
                        confirmProps: { color: 'red' },
                        onConfirm: async () => {
                          try {
                            await StorageService.RemoveStorage(storage.id!);
                            notifications.show({
                              color: 'green',
                              message: (
                                <Text size="sm">
                                  存储 <Code>{storage.name}</Code> 删除成功
                                </Text>
                              ),
                            });

                            fetchData();
                          } catch (error: any) {
                            notifications.show({ color: 'red', message: error.message });
                          }
                        },
                      });
                    }}
                  >
                    <RiDeleteBinLine color="red" />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </>
  );
}
