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
import { RiDeleteBinLine } from 'react-icons/ri';
import { GrRefresh } from 'react-icons/gr';
import { FiMoreHorizontal } from 'react-icons/fi';
import { IoMdOpen } from 'react-icons/io';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { DatabaseService, SystemService } from '../../../../bindings/github.com/pixelfs/pixelfs-desktop/services';
import * as services from '../../../../bindings/github.com/pixelfs/pixelfs-desktop/services';

export function Download(props: { opened: boolean }) {
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadList, setDownloadList] = useState<Array<services.TransportManager>>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setDownloadList((await DatabaseService.GetTransportManagers('download')).filter((t) => !!t));
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.opened) fetchData();
  }, [props.opened]);

  if (loading) {
    return (
      <Center mt={200}>
        <Loader color="blue" />
      </Center>
    );
  }

  if (isEmpty(downloadList)) {
    return (
      <Center mt={200}>
        <Text size="lg">没有下载任务</Text>
      </Center>
    );
  }

  return (
    <>
      <Group justify="end" mt={15}>
        <Button
          color="red"
          onClick={() =>
            modals.openConfirmModal({
              title: '提示',
              centered: true,
              children: <Text size="sm">确认要清空下载历史记录吗?</Text>,
              labels: { confirm: '删除', cancel: '取消' },
              confirmProps: { color: 'red' },
              onConfirm: async () => {
                try {
                  await DatabaseService.DeleteTransportManagerByType('download');
                  fetchData();
                } catch (error: any) {
                  notifications.show({ color: 'red', message: error.message });
                }
              },
            })
          }
        >
          清空历史
        </Button>
        <ActionIcon variant="transparent" size={20} onClick={() => fetchData()}>
          <GrRefresh size={15} color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
        </ActionIcon>
      </Group>

      <Table striped highlightOnHover withRowBorders={false}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>路径</Table.Th>
            <Table.Th>进度</Table.Th>
            <Table.Th>状态</Table.Th>
            <Table.Th>位置</Table.Th>
            <Table.Th>节点</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {downloadList.map((download, _) => (
            <Table.Tr key={download.ID}>
              <Table.Td>
                <Tooltip label={download.Path}>
                  <Text lineClamp={1} size="sm">
                    {download.Path}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>{download.Progress}%</Table.Td>
              <Table.Td>{download.Status}</Table.Td>
              <Table.Td>
                <Tooltip label={download.Location}>
                  <Text w={80} lineClamp={1} size="sm">
                    {download.Location}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>{download.NodeId}</Table.Td>
              <Table.Td>
                <Menu shadow="md" width={170}>
                  <Menu.Target>
                    <ActionIcon variant="transparent" size={17}>
                      <FiMoreHorizontal color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IoMdOpen size={14} />}
                      onClick={async () => {
                        try {
                          if (download.Progress !== 100) {
                            notifications.show({ color: 'red', message: '下载未完成' });
                            return;
                          }

                          await SystemService.OpenFile(download.LocalPath ?? '');
                        } catch (error: any) {
                          notifications.show({ color: 'red', message: error.message });
                        }
                      }}
                    >
                      使用系统默认打开
                    </Menu.Item>
                    <Menu.Item
                      color="red"
                      leftSection={<RiDeleteBinLine size={14} />}
                      onClick={async () => {
                        await DatabaseService.DeleteTransportManager(download.ID);
                        fetchData();
                      }}
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
    </>
  );
}
