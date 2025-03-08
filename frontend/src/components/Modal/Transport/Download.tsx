import { isEmpty } from 'lodash-es';
import { ActionIcon, Center, Group, Loader, Menu, Table, Text, Tooltip, useMantineColorScheme } from '@mantine/core';
import { models } from '../../../../wailsjs/go/models';
import { DeleteDownload, GetDownloadList } from '../../../../wailsjs/go/services/DatabaseService';
import { useEffect, useState } from 'react';
import { RiDeleteBinLine } from 'react-icons/ri';
import { GrRefresh } from 'react-icons/gr';
import { FiMoreHorizontal } from 'react-icons/fi';
import { IoMdOpen } from 'react-icons/io';
import { OpenFile } from '../../../../wailsjs/go/services/SystemService';
import { notifications } from '@mantine/notifications';

export function Download(props: { opened: boolean }) {
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadList, setDownloadList] = useState<Array<models.Download>>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setDownloadList(await GetDownloadList());
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
      <Center mt={150}>
        <Loader color="blue" />
      </Center>
    );
  }

  if (isEmpty(downloadList)) {
    return (
      <Center mt={150}>
        <Text size="lg">没下载任务</Text>
      </Center>
    );
  }

  return (
    <>
      <Group justify="end" mt={15}>
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

                          await OpenFile(download.LocalPath);
                        } catch (error: any) {
                          notifications.show({ color: 'red', message: error });
                        }
                      }}
                    >
                      使用系统默认打开
                    </Menu.Item>
                    <Menu.Item
                      color="red"
                      leftSection={<RiDeleteBinLine size={14} />}
                      onClick={async () => {
                        await DeleteDownload(download.ID);
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
